import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { type DrizzleClient } from '../../../shared/database/drizzle.module';
import { businesses } from '../../business/infrastructure/schema/business.schema';
import { branches } from '../../branch/infrastructure/schema/branch.schema';
import {
  businessUsers,
  memberBranches,
} from '../../../shared/database/relations/business.user.schema';
import { users } from '../../users/infrastructure/schema/user.schema';
import {
  businessProtectedPermissions,
  permissions,
  rolePermissionRequests,
  rolePermissions,
  roles,
} from './schema/access.schema';
import {
  ALL_PERMISSIONS,
  PermissionType,
  PermissionTypeMetaData,
} from '../enums/auth-permissions.enum';
import { SystemRole, SystemRoleMetaData } from '../enums/auth-role.enum';
import { BusinessType } from '../enums/business-type.enum';

/** Either the pool-backed client or an open transaction. */
export type Executor =
  | DrizzleClient
  | Parameters<Parameters<DrizzleClient['transaction']>[0]>[0];

export interface RoleRecord {
  id: string;
  businessId: string | null;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: PermissionType[];
}

export interface OperableBranch {
  id: string;
  isDefault: boolean;
}

export interface MembershipRecord {
  userId: string;
  orgId: string;
  businessId: string;
  roleId: string | null;
  roleKey: string | null;
  permissions: PermissionType[];
  isBanned: boolean;
  /**
   * Branches the member has been limited to (any status), or null when they
   * may work in every branch.
   */
  restrictedBranchIds: string[] | null;
  /** Active branches the member may operate in, default branch first. */
  operableBranches: OperableBranch[];
}

@Injectable()
export class AccessRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  /** Serializes membership/role mutations for one business (last-owner races). */
  async withBusinessLock<T>(
    orgId: string,
    fn: (tx: Executor) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${orgId}))`);
      return fn(tx);
    });
  }

  // ── catalog sync ──────────────────────────────────────────────────────────

  /**
   * Makes the DB catalog and built-in roles match the code. Idempotent; safe to
   * run on every boot and from several instances at once.
   */
  async syncCatalog(): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext('access-sync'))`,
      );

      await tx
        .insert(permissions)
        .values(
          ALL_PERMISSIONS.map((key) => ({
            key,
            label: PermissionTypeMetaData[key].label,
            description: PermissionTypeMetaData[key].description,
          })),
        )
        .onConflictDoUpdate({
          target: permissions.key,
          set: {
            label: sql`excluded.label`,
            description: sql`excluded.description`,
          },
        });

      const permRows = await tx.select().from(permissions);
      const permIdByKey = new Map(permRows.map((p) => [p.key, p.id]));

      for (const key of Object.values(SystemRole)) {
        const meta = SystemRoleMetaData[key];
        let [role] = await tx
          .select()
          .from(roles)
          .where(and(eq(roles.key, key), isNull(roles.businessId)));

        if (!role) {
          [role] = await tx
            .insert(roles)
            .values({
              key,
              name: meta.label,
              description: meta.description,
              isSystem: true,
            })
            .returning();
        } else {
          await tx
            .update(roles)
            .set({ name: meta.label, description: meta.description })
            .where(eq(roles.id, role.id));
        }

        await tx
          .delete(rolePermissions)
          .where(eq(rolePermissions.roleId, role.id));
        await tx.insert(rolePermissions).values(
          meta.permissions.map((p) => ({
            roleId: role.id,
            permissionId: permIdByKey.get(p)!,
          })),
        );
      }
    });
  }

  // ── reads ─────────────────────────────────────────────────────────────────

  async findMembership(
    userId: string,
    orgId: string,
    db: Executor = this.db,
  ): Promise<MembershipRecord | null> {
    const rows = await db
      .select({
        businessId: businesses.id,
        roleId: roles.id,
        roleKey: roles.key,
        permission: permissions.key,
        isBanned: businessUsers.isBanned,
      })
      .from(businessUsers)
      .innerJoin(businesses, eq(businesses.orgId, businessUsers.businessId))
      .innerJoin(roles, eq(roles.id, businessUsers.roleId))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(
        and(
          eq(businessUsers.userClerkId, userId),
          eq(businessUsers.businessId, orgId),
        ),
      );

    if (rows.length === 0) {
      // Either not a member, or a member without a role: both mean no access,
      // but the second still needs to be distinguishable for callers.
      const [row] = await db
        .select({ businessId: businesses.id, isBanned: businessUsers.isBanned })
        .from(businessUsers)
        .innerJoin(businesses, eq(businesses.orgId, businessUsers.businessId))
        .where(
          and(
            eq(businessUsers.userClerkId, userId),
            eq(businessUsers.businessId, orgId),
          ),
        );
      if (!row) return null;
      return {
        userId,
        orgId,
        businessId: row.businessId,
        roleId: null,
        roleKey: null,
        permissions: [],
        isBanned: row.isBanned,
        ...(await this.loadBranchAccess(row.businessId, userId, orgId, db)),
      };
    }

    return {
      userId,
      orgId,
      businessId: rows[0].businessId,
      roleId: rows[0].roleId,
      roleKey: rows[0].roleKey,
      permissions: rows
        .map((r) => r.permission)
        .filter((p): p is PermissionType => p !== null),
      isBanned: rows[0].isBanned,
      ...(await this.loadBranchAccess(rows[0].businessId, userId, orgId, db)),
    };
  }

  /**
   * Which branches a member may operate in. Restriction rows are authoritative:
   * a member who has any is limited to exactly those branches (never silently
   * widened, even if all of them are later deactivated).
   */
  private async loadBranchAccess(
    businessId: string,
    userId: string,
    orgId: string,
    db: Executor,
  ): Promise<
    Pick<MembershipRecord, 'restrictedBranchIds' | 'operableBranches'>
  > {
    const [active, restrictedRows] = await Promise.all([
      db
        .select({ id: branches.id, isDefault: branches.isDefault })
        .from(branches)
        .where(
          and(eq(branches.businessId, businessId), eq(branches.isActive, true)),
        )
        .orderBy(desc(branches.isDefault), asc(branches.createdAt)),
      db
        .select({ branchId: memberBranches.branchId })
        .from(memberBranches)
        .where(
          and(
            eq(memberBranches.userClerkId, userId),
            eq(memberBranches.businessId, orgId),
          ),
        ),
    ]);

    if (restrictedRows.length === 0) {
      return { restrictedBranchIds: null, operableBranches: active };
    }
    const allowed = new Set(restrictedRows.map((r) => r.branchId));
    return {
      restrictedBranchIds: [...allowed],
      operableBranches: active.filter((b) => allowed.has(b.id)),
    };
  }

  async orgIdBySlug(slug: string): Promise<string | undefined> {
    const [row] = await this.db
      .select({ orgId: businesses.orgId })
      .from(businesses)
      .where(eq(businesses.slug, slug));
    return row?.orgId;
  }

  async listMembershipOrgIds(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ orgId: businessUsers.businessId })
      .from(businessUsers)
      .where(eq(businessUsers.userClerkId, userId));
    return rows.map((r) => r.orgId);
  }

  async listBusinessesForUser(userId: string) {
    return this.db
      .select({
        orgId: businesses.orgId,
        slug: businesses.slug,
        name: businesses.name,
        businessType: businesses.businessType,
        imageUrl: businesses.imageUrl,
        onboardingCompletedAt: businesses.onboardingCompletedAt,
        roleKey: roles.key,
      })
      .from(businessUsers)
      .innerJoin(businesses, eq(businesses.orgId, businessUsers.businessId))
      .leftJoin(roles, eq(roles.id, businessUsers.roleId))
      .where(eq(businessUsers.userClerkId, userId));
  }

  async listMembers(orgId: string) {
    const rows = await this.db
      .select({
        userId: users.clerkId,
        name: users.name,
        imageUrl: users.imageUrl,
        roleId: roles.id,
        roleKey: roles.key,
        roleName: roles.name,
        joinedAt: businessUsers.joinedAt,
        isBanned: businessUsers.isBanned,
        bannedAt: businessUsers.bannedAt,
        banReason: businessUsers.banReason,
      })
      .from(businessUsers)
      .innerJoin(users, eq(users.clerkId, businessUsers.userClerkId))
      .leftJoin(roles, eq(roles.id, businessUsers.roleId))
      .where(eq(businessUsers.businessId, orgId));

    const restrictions = await this.db
      .select({
        userId: memberBranches.userClerkId,
        branchId: memberBranches.branchId,
      })
      .from(memberBranches)
      .where(eq(memberBranches.businessId, orgId));
    const byUser = new Map<string, string[]>();
    for (const r of restrictions) {
      byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), r.branchId]);
    }
    // Empty = not restricted (may work in every branch).
    return rows.map((r) => ({ ...r, branchIds: byUser.get(r.userId) ?? [] }));
  }

  /** System roles plus this business's custom roles, with their permissions. */
  async listRoles(
    orgId: string,
    db: Executor = this.db,
  ): Promise<RoleRecord[]> {
    return this.loadRoles(
      or(isNull(roles.businessId), eq(roles.businessId, orgId))!,
      db,
    );
  }

  async findRole(
    roleId: string,
    db: Executor = this.db,
  ): Promise<RoleRecord | null> {
    const [role] = await this.loadRoles(eq(roles.id, roleId), db);
    return role ?? null;
  }

  async findSystemRole(
    key: SystemRole,
    db: Executor = this.db,
  ): Promise<RoleRecord | null> {
    const [role] = await this.loadRoles(
      and(eq(roles.key, key), isNull(roles.businessId))!,
      db,
    );
    return role ?? null;
  }

  private async loadRoles(
    where: ReturnType<typeof eq>,
    db: Executor,
  ): Promise<RoleRecord[]> {
    const rows = await db
      .select({
        id: roles.id,
        businessId: roles.businessId,
        key: roles.key,
        name: roles.name,
        description: roles.description,
        isSystem: roles.isSystem,
        permission: permissions.key,
      })
      .from(roles)
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(where);

    const byId = new Map<string, RoleRecord>();
    for (const { permission, ...role } of rows) {
      const record = byId.get(role.id) ?? { ...role, permissions: [] };
      if (permission) record.permissions.push(permission as PermissionType);
      byId.set(role.id, record);
    }
    return [...byId.values()];
  }

  async countMembersWithRole(roleId: string, db: Executor = this.db) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(businessUsers)
      .where(eq(businessUsers.roleId, roleId));
    return row.count;
  }

  async countOwners(
    orgId: string,
    ownerRoleId: string,
    db: Executor = this.db,
  ) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(businessUsers)
      .where(
        and(
          eq(businessUsers.businessId, orgId),
          eq(businessUsers.roleId, ownerRoleId),
        ),
      );
    return row.count;
  }

  // ── writes ────────────────────────────────────────────────────────────────

  async createBusinessWithOwner(params: {
    orgId: string;
    slug: string;
    name: string;
    businessType: BusinessType;
    profile?: Partial<typeof businesses.$inferInsert>;
    ownerUserId: string;
    ownerRoleId: string;
  }) {
    await this.db.transaction(async (tx) => {
      const [business] = await tx
        .insert(businesses)
        .values({
          ...params.profile,
          orgId: params.orgId,
          slug: params.slug,
          name: params.name,
          businessType: params.businessType,
        })
        .returning({ id: businesses.id });
      // Every business starts with one branch, so single-location shops never
      // have to deal with branches at all.
      await tx.insert(branches).values({
        businessId: business.id,
        code: 'MAIN',
        name: 'Main',
        isDefault: true,
      });
      await tx.insert(businessUsers).values({
        businessId: params.orgId,
        userClerkId: params.ownerUserId,
        roleId: params.ownerRoleId,
      });
    });
  }

  async addMember(
    orgId: string,
    userId: string,
    roleId: string,
    db: Executor = this.db,
  ) {
    await db
      .insert(businessUsers)
      .values({ businessId: orgId, userClerkId: userId, roleId });
  }

  async setMemberRole(
    orgId: string,
    userId: string,
    roleId: string,
    db: Executor = this.db,
  ) {
    await db
      .update(businessUsers)
      .set({ roleId })
      .where(
        and(
          eq(businessUsers.businessId, orgId),
          eq(businessUsers.userClerkId, userId),
        ),
      );
  }

  /** Replaces the member's branch restriction; an empty list lifts it. */
  async setMemberBranches(
    orgId: string,
    userId: string,
    branchIds: string[],
    db: Executor = this.db,
  ) {
    await db
      .delete(memberBranches)
      .where(
        and(
          eq(memberBranches.businessId, orgId),
          eq(memberBranches.userClerkId, userId),
        ),
      );
    if (branchIds.length > 0) {
      await db.insert(memberBranches).values(
        branchIds.map((branchId) => ({
          userClerkId: userId,
          businessId: orgId,
          branchId,
        })),
      );
    }
  }

  /** Ids (of the given) that are branches of this business, active or not. */
  async branchIdsInBusiness(
    businessId: string,
    ids: string[],
    db: Executor = this.db,
  ): Promise<string[]> {
    if (ids.length === 0) return [];
    const rows = await db
      .select({ id: branches.id })
      .from(branches)
      .where(
        and(eq(branches.businessId, businessId), inArray(branches.id, ids)),
      );
    return rows.map((r) => r.id);
  }

  async removeMember(orgId: string, userId: string, db: Executor = this.db) {
    await db
      .delete(businessUsers)
      .where(
        and(
          eq(businessUsers.businessId, orgId),
          eq(businessUsers.userClerkId, userId),
        ),
      );
  }

  async createRole(
    params: {
      orgId: string;
      key: string;
      name: string;
      description?: string | null;
      permissions: PermissionType[];
    },
    db: Executor = this.db,
  ) {
    const [role] = await db
      .insert(roles)
      .values({
        businessId: params.orgId,
        key: params.key,
        name: params.name,
        description: params.description ?? null,
        isSystem: false,
      })
      .returning();
    await this.replaceRolePermissions(role.id, params.permissions, db);
    return role.id;
  }

  async updateRole(
    roleId: string,
    patch: {
      name?: string;
      description?: string | null;
      permissions?: PermissionType[];
    },
    db: Executor = this.db,
  ) {
    if (patch.name !== undefined || patch.description !== undefined) {
      await db
        .update(roles)
        .set({
          ...(patch.name !== undefined && { name: patch.name }),
          ...(patch.description !== undefined && {
            description: patch.description,
          }),
        })
        .where(eq(roles.id, roleId));
    }
    if (patch.permissions) {
      await this.replaceRolePermissions(roleId, patch.permissions, db);
    }
  }

  async deleteRole(roleId: string, db: Executor = this.db) {
    await db.delete(roles).where(eq(roles.id, roleId));
  }

  private async replaceRolePermissions(
    roleId: string,
    keys: PermissionType[],
    db: Executor,
  ) {
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    if (keys.length === 0) return;
    const rows = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.key, keys));
    await db
      .insert(rolePermissions)
      .values(rows.map((p) => ({ roleId, permissionId: p.id })));
  }

  /** Adds permissions (by id) to a role without touching the ones already there. */
  async addRolePermissionsByIds(
    roleId: string,
    permissionIds: string[],
    db: Executor = this.db,
  ) {
    if (permissionIds.length === 0) return;
    await db
      .insert(rolePermissions)
      .values(permissionIds.map((permissionId) => ({ roleId, permissionId })))
      .onConflictDoNothing();
  }

  // ── protected permissions (per-business) ────────────────────────────────

  /** The subset of the given keys this business currently marks protected. */
  async protectedKeysWithin(
    orgId: string,
    keys: PermissionType[],
    db: Executor = this.db,
  ): Promise<Set<PermissionType>> {
    if (keys.length === 0) return new Set();
    const rows = await db
      .select({ key: permissions.key })
      .from(permissions)
      .innerJoin(
        businessProtectedPermissions,
        and(
          eq(businessProtectedPermissions.permissionId, permissions.id),
          eq(businessProtectedPermissions.businessId, orgId),
        ),
      )
      .where(inArray(permissions.key, keys));
    return new Set(rows.map((r) => r.key as PermissionType));
  }

  async setPermissionProtected(
    orgId: string,
    permissionId: string,
    protectedFlag: boolean,
    db: Executor = this.db,
  ) {
    if (protectedFlag) {
      await db
        .insert(businessProtectedPermissions)
        .values({ businessId: orgId, permissionId })
        .onConflictDoNothing();
    } else {
      await db
        .delete(businessProtectedPermissions)
        .where(
          and(
            eq(businessProtectedPermissions.businessId, orgId),
            eq(businessProtectedPermissions.permissionId, permissionId),
          ),
        );
    }
  }

  /** Bare catalog rows (id/key/label/description), no per-business flag. */
  async listPermissionRows(db: Executor = this.db) {
    return db.select().from(permissions);
  }

  /** Catalog rows with `protected` resolved for one business. */
  async listPermissionCatalogForBusiness(orgId: string, db: Executor = this.db) {
    const rows = await db
      .select({
        id: permissions.id,
        key: permissions.key,
        label: permissions.label,
        description: permissions.description,
        protected: sql<boolean>`${businessProtectedPermissions.permissionId} is not null`,
      })
      .from(permissions)
      .leftJoin(
        businessProtectedPermissions,
        and(
          eq(businessProtectedPermissions.permissionId, permissions.id),
          eq(businessProtectedPermissions.businessId, orgId),
        ),
      );
    return rows;
  }

  async findPermissionById(id: string, db: Executor = this.db) {
    const [row] = await db
      .select()
      .from(permissions)
      .where(eq(permissions.id, id));
    return row ?? null;
  }

  // ── role permission requests ────────────────────────────────────────────

  async createRolePermissionRequest(
    params: { roleId: string; permissionIds: string[]; requestedBy: string },
    db: Executor = this.db,
  ) {
    const [row] = await db
      .insert(rolePermissionRequests)
      .values({
        roleId: params.roleId,
        requestedPermissionIds: params.permissionIds,
        requestedBy: params.requestedBy,
      })
      .returning();
    return row;
  }

  /** Pending requests against roles owned by this business. */
  async listPendingRequests(orgId: string, db: Executor = this.db) {
    return db
      .select({
        id: rolePermissionRequests.id,
        roleId: rolePermissionRequests.roleId,
        roleName: roles.name,
        requestedPermissionIds: rolePermissionRequests.requestedPermissionIds,
        requestedBy: rolePermissionRequests.requestedBy,
        requestedByName: users.name,
        createdAt: rolePermissionRequests.createdAt,
      })
      .from(rolePermissionRequests)
      .innerJoin(roles, eq(roles.id, rolePermissionRequests.roleId))
      .innerJoin(users, eq(users.clerkId, rolePermissionRequests.requestedBy))
      .where(
        and(
          eq(roles.businessId, orgId),
          eq(rolePermissionRequests.status, 'pending'),
        ),
      );
  }

  async findPendingRequest(id: string, orgId: string, db: Executor = this.db) {
    const [row] = await db
      .select({
        id: rolePermissionRequests.id,
        roleId: rolePermissionRequests.roleId,
        requestedPermissionIds: rolePermissionRequests.requestedPermissionIds,
        status: rolePermissionRequests.status,
      })
      .from(rolePermissionRequests)
      .innerJoin(roles, eq(roles.id, rolePermissionRequests.roleId))
      .where(
        and(eq(rolePermissionRequests.id, id), eq(roles.businessId, orgId)),
      );
    return row ?? null;
  }

  async reviewRequest(
    id: string,
    status: 'approved' | 'rejected',
    reviewedBy: string,
    db: Executor = this.db,
  ) {
    await db
      .update(rolePermissionRequests)
      .set({ status, reviewedBy, reviewedAt: new Date() })
      .where(eq(rolePermissionRequests.id, id));
  }

  // ── bans ─────────────────────────────────────────────────────────────────

  async setMemberBan(
    orgId: string,
    userId: string,
    params: { banned: boolean; bannedBy?: string; reason?: string | null },
    db: Executor = this.db,
  ) {
    await db
      .update(businessUsers)
      .set(
        params.banned
          ? {
              isBanned: true,
              bannedAt: new Date(),
              bannedBy: params.bannedBy,
              banReason: params.reason ?? null,
            }
          : {
              isBanned: false,
              bannedAt: null,
              bannedBy: null,
              banReason: null,
            },
      )
      .where(
        and(
          eq(businessUsers.businessId, orgId),
          eq(businessUsers.userClerkId, userId),
        ),
      );
  }
}
