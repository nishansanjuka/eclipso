import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthContext } from '../domain/auth-context';
import {
  ALL_PERMISSIONS,
  PermissionType,
  PermissionTypeMetaData,
} from '../enums/auth-permissions.enum';
import { SystemRole } from '../enums/auth-role.enum';
import { BusinessType } from '../enums/business-type.enum';
import {
  AccessRepository,
  Executor,
  RoleRecord,
} from '../infrastructure/access.repository';
import { AccessService } from '../infrastructure/access.service';
import { BusinessService } from '../../business/infrastructure/business.service';

/**
 * Business, member and role administration on our own tables.
 *
 * Rules enforced here (not just at the route, so no caller can skip them):
 *  - no privilege escalation: an actor can only grant permissions they hold
 *    themselves, and can only touch members/roles whose permissions are a
 *    subset of their own;
 *  - built-in roles are immutable;
 *  - a business always keeps at least one owner;
 *  - a role can only be assigned inside the business that owns it.
 */
@Injectable()
export class AccessManagementUseCase {
  constructor(
    private readonly repository: AccessRepository,
    private readonly access: AccessService,
    private readonly businessService: BusinessService,
  ) {}

  // ── business ──────────────────────────────────────────────────────────────

  async createBusiness(
    actor: AuthContext,
    input: { name: string; businessType: BusinessType },
  ) {
    const ownerRole = await this.repository.findSystemRole(SystemRole.Owner);
    if (!ownerRole) throw new Error('Owner system role is not initialised');

    const orgId = `biz_${randomUUID().replaceAll('-', '')}`;
    await this.repository.createBusinessWithOwner({
      orgId,
      name: input.name,
      businessType: input.businessType,
      ownerUserId: actor.userId,
      ownerRoleId: ownerRole.id,
    });
    this.access.invalidateMember(orgId, actor.userId);

    return { orgId, ...input };
  }

  async updateBusiness(
    actor: AuthContext,
    input: { name?: string; businessType?: BusinessType },
  ) {
    await this.businessService.updateBusiness({
      orgId: actor.orgId!,
      ...input,
    });
    return { orgId: actor.orgId!, ...input };
  }

  async deleteBusiness(actor: AuthContext) {
    await this.businessService.deleteBusiness(actor.orgId!);
    this.access.invalidateBusiness(actor.orgId!);
    return { orgId: actor.orgId! };
  }

  listMyBusinesses(actor: AuthContext) {
    return this.repository.listBusinessesForUser(actor.userId);
  }

  // ── catalog ───────────────────────────────────────────────────────────────

  listPermissionCatalog() {
    return ALL_PERMISSIONS.map((key) => ({
      key,
      ...PermissionTypeMetaData[key],
    }));
  }

  // ── members ───────────────────────────────────────────────────────────────

  listMembers(actor: AuthContext) {
    return this.repository.listMembers(actor.orgId!);
  }

  async assignRole(actor: AuthContext, targetUserId: string, roleId: string) {
    const orgId = actor.orgId!;

    await this.repository.withBusinessLock(orgId, async (tx) => {
      const target = await this.repository.findMembership(
        targetUserId,
        orgId,
        tx,
      );
      if (!target) throw new NotFoundException('Member not found.');
      this.assertCanManageBranches(actor, target.restrictedBranchIds);

      const role = await this.requireAssignableRole(orgId, roleId, tx);
      this.assertCanGrant(actor, role.permissions);
      this.assertCanGrant(actor, target.permissions);
      await this.assertOwnerRemains(orgId, target.roleKey, role.key, tx);

      await this.repository.setMemberRole(orgId, targetUserId, role.id, tx);
    });

    this.access.invalidateMember(orgId, targetUserId);
    return { userId: targetUserId, roleId };
  }

  async removeMember(actor: AuthContext, targetUserId: string) {
    const orgId = actor.orgId!;

    await this.repository.withBusinessLock(orgId, async (tx) => {
      const target = await this.repository.findMembership(
        targetUserId,
        orgId,
        tx,
      );
      if (!target) throw new NotFoundException('Member not found.');
      this.assertCanManageBranches(actor, target.restrictedBranchIds);

      this.assertCanGrant(actor, target.permissions);
      await this.assertOwnerRemains(orgId, target.roleKey, null, tx);

      await this.repository.removeMember(orgId, targetUserId, tx);
    });

    this.access.invalidateMember(orgId, targetUserId);
    return { userId: targetUserId };
  }

  /**
   * Limits a member to specific branches (empty = every branch).
   *
   * A member who is themselves limited to some branches can only manage members
   * inside those branches and can never lift a restriction, so branch limits
   * cannot be escaped by asking a limited colleague.
   */
  async setMemberBranches(
    actor: AuthContext,
    targetUserId: string,
    branchIds: string[],
  ) {
    const orgId = actor.orgId!;

    await this.repository.withBusinessLock(orgId, async (tx) => {
      const target = await this.repository.findMembership(
        targetUserId,
        orgId,
        tx,
      );
      if (!target) throw new NotFoundException('Member not found.');

      this.assertCanGrant(actor, target.permissions);
      this.assertCanManageBranches(actor, target.restrictedBranchIds);

      if (actor.branchRestricted) {
        if (branchIds.length === 0) {
          throw new ForbiddenException(
            'You are limited to specific branches and cannot give access to all branches.',
          );
        }
        const outside = branchIds.filter((id) => !actor.canAccessBranch(id));
        if (outside.length > 0) {
          throw new ForbiddenException(
            'You cannot grant access to branches you cannot work in yourself.',
          );
        }
      }

      const valid = await this.repository.branchIdsInBusiness(
        actor.businessId!,
        branchIds,
        tx,
      );
      if (valid.length !== branchIds.length) {
        throw new NotFoundException('Branch not found.');
      }

      await this.repository.setMemberBranches(
        orgId,
        targetUserId,
        branchIds,
        tx,
      );
    });

    this.access.invalidateMember(orgId, targetUserId);
    return { userId: targetUserId, branchIds };
  }

  // ── roles ─────────────────────────────────────────────────────────────────

  listRoles(actor: AuthContext) {
    return this.repository.listRoles(actor.orgId!);
  }

  async createRole(
    actor: AuthContext,
    input: {
      name: string;
      description?: string | null;
      permissions: PermissionType[];
    },
  ) {
    const orgId = actor.orgId!;
    this.assertCanGrant(actor, input.permissions);

    return this.repository.withBusinessLock(orgId, async (tx) => {
      const key = this.slugify(input.name);
      const existing = await this.repository.listRoles(orgId, tx);
      if (existing.some((r) => r.key === key)) {
        throw new ConflictException('A role with this name already exists.');
      }
      const id = await this.repository.createRole({ orgId, key, ...input }, tx);
      return { id, key, ...input };
    });
  }

  async updateRole(
    actor: AuthContext,
    roleId: string,
    patch: {
      name?: string;
      description?: string | null;
      permissions?: PermissionType[];
    },
  ) {
    const orgId = actor.orgId!;

    await this.repository.withBusinessLock(orgId, async (tx) => {
      const role = await this.requireCustomRole(orgId, roleId, tx);
      // Can't edit a role that is more powerful than you, nor lift one above you.
      this.assertCanGrant(actor, role.permissions);
      if (patch.permissions) this.assertCanGrant(actor, patch.permissions);

      await this.repository.updateRole(roleId, patch, tx);
    });

    // Everyone holding this role sees the change on their next request.
    this.access.invalidateBusiness(orgId);
    return { id: roleId, ...patch };
  }

  async deleteRole(actor: AuthContext, roleId: string) {
    const orgId = actor.orgId!;

    await this.repository.withBusinessLock(orgId, async (tx) => {
      const role = await this.requireCustomRole(orgId, roleId, tx);
      this.assertCanGrant(actor, role.permissions);

      if ((await this.repository.countMembersWithRole(roleId, tx)) > 0) {
        throw new ConflictException(
          'Role is still assigned to members; reassign them first.',
        );
      }
      await this.repository.deleteRole(roleId, tx);
    });

    return { id: roleId };
  }

  // ── guards ────────────────────────────────────────────────────────────────

  /**
   * A branch-limited actor may only touch members who are limited to branches
   * the actor can also work in; an unrestricted member is out of their reach.
   */
  private assertCanManageBranches(
    actor: AuthContext,
    targetRestrictedBranchIds: readonly string[] | null,
  ) {
    if (!actor.branchRestricted) return;
    const withinReach =
      targetRestrictedBranchIds !== null &&
      targetRestrictedBranchIds.every((id) => actor.canAccessBranch(id));
    if (!withinReach) {
      throw new ForbiddenException(
        'You can only manage members who work in your own branches.',
      );
    }
  }

  /** Actor may only hand out / touch permissions they hold themselves. */
  private assertCanGrant(actor: AuthContext, permissions: readonly string[]) {
    const missing = permissions.filter((p) => !actor.has(p as PermissionType));
    if (missing.length > 0) {
      throw new ForbiddenException(
        `You cannot grant or modify permissions you do not hold: ${missing.join(', ')}`,
      );
    }
  }

  /** Blocks any change that would leave the business without an owner. */
  private async assertOwnerRemains(
    orgId: string,
    currentRoleKey: string | null,
    nextRoleKey: string | null,
    tx: Executor,
  ) {
    const leavingOwner =
      currentRoleKey === SystemRole.Owner && nextRoleKey !== SystemRole.Owner;
    if (!leavingOwner) return;

    const ownerRole = await this.repository.findSystemRole(
      SystemRole.Owner,
      tx,
    );
    const owners = ownerRole
      ? await this.repository.countOwners(orgId, ownerRole.id, tx)
      : 0;
    if (owners <= 1) {
      throw new BadRequestException(
        'A business must keep at least one owner. Promote another owner first.',
      );
    }
  }

  /** System roles or this business's own custom roles; anything else is a 404. */
  private async requireAssignableRole(
    orgId: string,
    roleId: string,
    tx: Executor,
  ): Promise<RoleRecord> {
    const role = await this.repository.findRole(roleId, tx);
    if (!role || (role.businessId !== null && role.businessId !== orgId)) {
      throw new NotFoundException('Role not found.');
    }
    return role;
  }

  private async requireCustomRole(
    orgId: string,
    roleId: string,
    tx: Executor,
  ): Promise<RoleRecord> {
    const role = await this.requireAssignableRole(orgId, roleId, tx);
    if (role.isSystem) {
      throw new ForbiddenException('Built-in roles cannot be modified.');
    }
    return role;
  }

  private slugify(name: string) {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!slug) throw new BadRequestException('Role name is not valid.');
    return slug;
  }
}
