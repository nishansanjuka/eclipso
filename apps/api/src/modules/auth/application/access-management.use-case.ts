import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthContext } from '../domain/auth-context';
import { PermissionType } from '../enums/auth-permissions.enum';
import { SystemRole } from '../enums/auth-role.enum';
import { BusinessType } from '../enums/business-type.enum';
import {
  AccessRepository,
  Executor,
  RoleRecord,
} from '../infrastructure/access.repository';
import { AccessService } from '../infrastructure/access.service';
import { BusinessService } from '../../business/infrastructure/business.service';
import { isUniqueViolation } from '../../../shared/utils/pg-errors';
import { isValidSlug, slugify } from '../../../shared/utils/slug';
import { S3Service } from '../../../shared/services/s3.service';

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
    private readonly s3: S3Service,
  ) {}

  // ── business ──────────────────────────────────────────────────────────────

  async createBusiness(
    actor: AuthContext,
    input: {
      name: string;
      slug?: string;
      businessType: BusinessType;
      registeredName?: string | null;
      registrationNumber?: string | null;
      phone?: string | null;
      country?: string;
      addressLine?: string | null;
      city?: string | null;
      postalCode?: string | null;
    },
  ) {
    const ownerRole = await this.repository.findSystemRole(SystemRole.Owner);
    if (!ownerRole) throw new Error('Owner system role is not initialised');

    const { name, slug: requested, businessType, ...profile } = input;
    const slug = await this.chooseSlug(name, requested);
    const orgId = `biz_${randomUUID().replaceAll('-', '')}`;

    try {
      await this.repository.createBusinessWithOwner({
        orgId,
        slug,
        name,
        businessType,
        profile,
        ownerUserId: actor.userId,
        ownerRoleId: ownerRole.id,
      });
    } catch (error) {
      // Lost a race for the same address between the check and the insert.
      if (isUniqueViolation(error)) {
        throw new ConflictException('That workspace address is already taken.');
      }
      throw error;
    }
    this.access.invalidateMember(orgId, actor.userId);

    return { orgId, slug, name, businessType };
  }

  /**
   * A requested address must be free (or the request fails); with none given
   * we derive one from the name and add a short suffix until it is free.
   */
  private async chooseSlug(name: string, requested?: string) {
    if (requested) {
      if (await this.businessService.slugTaken(requested)) {
        throw new ConflictException('That workspace address is already taken.');
      }
      return requested;
    }
    const base = slugify(name);
    const candidates = [
      base,
      ...Array.from({ length: 5 }, () => this.suffix(base)),
    ];
    for (const candidate of candidates) {
      if (
        isValidSlug(candidate) &&
        !(await this.businessService.slugTaken(candidate))
      ) {
        return candidate;
      }
    }
    return `org-${randomUUID().replaceAll('-', '').slice(0, 10)}`;
  }

  private suffix(base: string) {
    const tail = randomUUID().replaceAll('-', '').slice(0, 4);
    return `${base.slice(0, 35)}-${tail}`.replace(/^-+/, '');
  }

  /** Is this workspace address usable (valid, not reserved, not taken)? */
  async slugAvailability(slug: string) {
    const normalized = slug.trim().toLowerCase();
    if (!isValidSlug(normalized)) {
      return { slug: normalized, available: false, reason: 'invalid' as const };
    }
    const taken = await this.businessService.slugTaken(normalized);
    return {
      slug: normalized,
      available: !taken,
      reason: taken ? ('taken' as const) : null,
    };
  }

  async getBusiness(actor: AuthContext) {
    const profile = await this.businessService.getProfile(actor.orgId!);
    if (!profile) throw new NotFoundException('Business not found.');
    // Internals (id, sale counter) are not part of the profile.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, saleSeq, ...rest } = profile;
    return rest;
  }

  async updateBusiness(
    actor: AuthContext,
    input: {
      name?: string;
      slug?: string;
      businessType?: BusinessType;
      registeredName?: string | null;
      registrationNumber?: string | null;
      phone?: string | null;
      country?: string;
      addressLine?: string | null;
      city?: string | null;
      postalCode?: string | null;
      imageUrl?: string | null;
      vatRegistered?: boolean;
      vatNumber?: string | null;
      vatRate?: string;
      currency?: string;
      rounding?: string;
      onboardingCompleted?: true;
    },
  ) {
    const { vatRate, onboardingCompleted, ...fields } = input;

    if (fields.slug) {
      const current = await this.businessService.getProfile(actor.orgId!);
      if (
        current &&
        current.slug !== fields.slug &&
        (await this.businessService.slugTaken(fields.slug))
      ) {
        throw new ConflictException('That workspace address is already taken.');
      }
    }

    try {
      const updated = await this.businessService.updateProfile(
        actor.orgId!,
        {
          ...fields,
          ...(onboardingCompleted && { onboardingCompletedAt: new Date() }),
        },
        vatRate,
      );
      if (!updated) throw new NotFoundException('Business not found.');
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('That workspace address is already taken.');
      }
      throw error;
    }
    return this.getBusiness(actor);
  }

  private static readonly LOGO_EXTENSIONS: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  };

  /** A one-time URL the browser uploads the logo to directly; never touches our server. */
  async presignLogoUpload(actor: AuthContext, contentType: string) {
    const ext = AccessManagementUseCase.LOGO_EXTENSIONS[contentType];
    const key = `businesses/${actor.orgId}/logo-${randomUUID()}.${ext}`;
    return this.s3.presignUpload(key, contentType);
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

  listPermissionCatalog(actor: AuthContext) {
    return this.repository.listPermissionCatalogForBusiness(actor.orgId!);
  }

  /** Only this business's `manage:protective-permissions` holders may relabel a permission. */
  async setPermissionProtected(
    actor: AuthContext,
    permissionId: string,
    protectedFlag: boolean,
  ) {
    this.requireManageProtective(actor);
    const permission = await this.repository.findPermissionById(permissionId);
    if (!permission) throw new NotFoundException('Permission not found.');
    await this.repository.setPermissionProtected(
      actor.orgId!,
      permissionId,
      protectedFlag,
    );
    return { id: permissionId, protected: protectedFlag };
  }

  // ── members ───────────────────────────────────────────────────────────────

  listMembers(actor: AuthContext) {
    return this.repository.listMembers(actor.orgId!);
  }

  /**
   * A business must always keep the option to reach its owner: banning is
   * `member:manage`, same as removing a member, but an Owner can never be
   * banned (mirrors `assertOwnerRemains`, minus the "last one" nuance — no
   * owner, ever, banned or not, is acceptable).
   */
  async banMember(
    actor: AuthContext,
    targetUserId: string,
    reason?: string | null,
  ) {
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
      if (target.roleKey === SystemRole.Owner) {
        throw new ForbiddenException('An owner cannot be banned.');
      }

      await this.repository.setMemberBan(
        orgId,
        targetUserId,
        { banned: true, bannedBy: actor.userId, reason },
        tx,
      );
    });

    this.access.invalidateMember(orgId, targetUserId);
    return { userId: targetUserId, isBanned: true };
  }

  async unbanMember(actor: AuthContext, targetUserId: string) {
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

      await this.repository.setMemberBan(
        orgId,
        targetUserId,
        { banned: false },
        tx,
      );
    });

    this.access.invalidateMember(orgId, targetUserId);
    return { userId: targetUserId, isBanned: false };
  }

  async assignRole(actor: AuthContext, targetUserId: string, roleId: string) {
    if (targetUserId === actor.userId) {
      throw new ForbiddenException('You cannot change your own role.');
    }
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

  /**
   * Splits a requested permission set into what applies now and what needs a
   * `manage:protective-permissions` holder's approval first.
   *
   * - Holding that permission: everything applies immediately, no request.
   * - Not holding it: protected permissions the role doesn't already have are
   *   held back as a pending request; everything else (unprotected, plus any
   *   protected permission the role already had) applies right away.
   */
  private async splitProtected(
    actor: AuthContext,
    requested: PermissionType[],
    currentlyGranted: readonly PermissionType[],
  ): Promise<{ toApply: PermissionType[]; toRequest: PermissionType[] }> {
    if (actor.has(PermissionType.MANAGE_PROTECTIVE_PERMISSIONS)) {
      return { toApply: requested, toRequest: [] };
    }
    const protectedKeys = await this.repository.protectedKeysWithin(
      actor.orgId!,
      requested,
    );
    if (protectedKeys.size === 0) return { toApply: requested, toRequest: [] };

    const currentlyGrantedSet = new Set(currentlyGranted);
    const toRequest = requested.filter(
      (p) => protectedKeys.has(p) && !currentlyGrantedSet.has(p),
    );
    const toApply = requested.filter((p) => !toRequest.includes(p));
    return { toApply, toRequest };
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
    const { toApply, toRequest } = await this.splitProtected(
      actor,
      input.permissions,
      [],
    );
    // An actor still needs to hold every permission they are asking to apply
    // or request — requesting a protected permission is not a way around
    // "you can't grant what you don't have".
    this.assertCanGrant(actor, toApply);
    this.assertCanGrant(actor, toRequest);

    return this.repository.withBusinessLock(orgId, async (tx) => {
      const key = this.slugify(input.name);
      const existing = await this.repository.listRoles(orgId, tx);
      if (existing.some((r) => r.key === key)) {
        throw new ConflictException('A role with this name already exists.');
      }
      const id = await this.repository.createRole(
        { orgId, key, ...input, permissions: toApply },
        tx,
      );
      let request: Awaited<
        ReturnType<AccessRepository['createRolePermissionRequest']>
      > | null = null;
      if (toRequest.length > 0) {
        const permIds = await this.permissionIdsForKeys(toRequest, tx);
        request = await this.repository.createRolePermissionRequest(
          { roleId: id, permissionIds: permIds, requestedBy: actor.userId },
          tx,
        );
      }
      return {
        id,
        key,
        name: input.name,
        description: input.description ?? null,
        permissions: toApply,
        pendingRequest: request,
      };
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
    let pendingRequest: Awaited<
      ReturnType<AccessRepository['createRolePermissionRequest']>
    > | null = null;

    await this.repository.withBusinessLock(orgId, async (tx) => {
      const role = await this.requireCustomRole(orgId, roleId, tx);
      // Can't edit a role that is more powerful than you, nor lift one above you.
      this.assertCanGrant(actor, role.permissions);

      let toApply = patch.permissions;
      if (patch.permissions) {
        const split = await this.splitProtected(
          actor,
          patch.permissions,
          role.permissions,
        );
        this.assertCanGrant(actor, split.toApply);
        this.assertCanGrant(actor, split.toRequest);
        toApply = split.toApply;
        if (split.toRequest.length > 0) {
          const permIds = await this.permissionIdsForKeys(split.toRequest, tx);
          pendingRequest = await this.repository.createRolePermissionRequest(
            { roleId, permissionIds: permIds, requestedBy: actor.userId },
            tx,
          );
        }
      }

      await this.repository.updateRole(
        roleId,
        { ...patch, permissions: toApply },
        tx,
      );
    });

    // Everyone holding this role sees the change on their next request.
    this.access.invalidateBusiness(orgId);
    return { id: roleId, ...patch, pendingRequest };
  }

  private async permissionIdsForKeys(
    keys: PermissionType[],
    tx: Executor,
  ): Promise<string[]> {
    const rows = await this.repository.listPermissionRows(tx);
    const byKey = new Map(rows.map((r) => [r.key, r.id]));
    return keys.map((k) => byKey.get(k)!).filter(Boolean);
  }

  // ── protected-permission requests ────────────────────────────────────────

  listPendingRequests(actor: AuthContext) {
    this.requireManageProtective(actor);
    return this.repository.listPendingRequests(actor.orgId!);
  }

  async reviewPermissionRequest(
    actor: AuthContext,
    requestId: string,
    approve: boolean,
  ) {
    this.requireManageProtective(actor);
    const orgId = actor.orgId!;

    const request = await this.repository.findPendingRequest(
      requestId,
      orgId,
    );
    if (!request || request.status !== 'pending') {
      throw new NotFoundException('Request not found.');
    }

    await this.repository.withBusinessLock(orgId, async (tx) => {
      if (approve) {
        await this.repository.addRolePermissionsByIds(
          request.roleId,
          request.requestedPermissionIds,
          tx,
        );
      }
      await this.repository.reviewRequest(
        requestId,
        approve ? 'approved' : 'rejected',
        actor.userId,
        tx,
      );
    });

    this.access.invalidateBusiness(orgId);
    return { id: requestId, status: approve ? 'approved' : 'rejected' };
  }

  private requireManageProtective(actor: AuthContext) {
    if (!actor.has(PermissionType.MANAGE_PROTECTIVE_PERMISSIONS)) {
      throw new ForbiddenException(
        'You do not have permission to manage protected permissions.',
      );
    }
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
