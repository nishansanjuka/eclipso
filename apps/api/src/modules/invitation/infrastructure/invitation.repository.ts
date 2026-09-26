import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import {
  type DbExecutor,
  type DrizzleClient,
} from '../../../shared/database/drizzle.module';
import { businesses } from '../../business/infrastructure/schema/business.schema';
import { branches } from '../../branch/infrastructure/schema/branch.schema';
import { roles } from '../../auth/infrastructure/schema/access.schema';
import { users } from '../../users/infrastructure/schema/user.schema';
import {
  businessUsers,
  memberBranches,
} from '../../../shared/database/relations/business.user.schema';
import { invitations } from './schema/invitation.schema';

@Injectable()
export class InvitationRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  transaction<T>(fn: (tx: DbExecutor) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) => fn(tx));
  }

  /** Newest first, with the role and inviter names for display. */
  list(businessId: string) {
    return this.db
      .select({
        id: invitations.id,
        email: invitations.email,
        roleId: invitations.roleId,
        roleName: roles.name,
        branchIds: invitations.branchIds,
        status: invitations.status,
        invitedBy: invitations.invitedBy,
        invitedByName: users.name,
        expiresAt: invitations.expiresAt,
        lastSentAt: invitations.lastSentAt,
        sendCount: invitations.sendCount,
        acceptedAt: invitations.acceptedAt,
        revokedAt: invitations.revokedAt,
        createdAt: invitations.createdAt,
      })
      .from(invitations)
      .innerJoin(roles, eq(roles.id, invitations.roleId))
      .leftJoin(users, eq(users.clerkId, invitations.invitedBy))
      .where(eq(invitations.businessId, businessId))
      .orderBy(desc(invitations.createdAt));
  }

  /** Locks the row so resend / revoke / accept on one invitation run one at a time. */
  async lockById(tx: DbExecutor, businessId: string, id: string) {
    const [row] = await tx
      .select()
      .from(invitations)
      .where(
        and(eq(invitations.id, id), eq(invitations.businessId, businessId)),
      )
      .for('update');
    return row;
  }

  async lockPendingByEmail(tx: DbExecutor, businessId: string, email: string) {
    const [row] = await tx
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.businessId, businessId),
          eq(invitations.email, email),
          eq(invitations.status, 'pending'),
        ),
      )
      .for('update');
    return row;
  }

  async lockByTokenHash(tx: DbExecutor, tokenHash: string) {
    const [row] = await tx
      .select()
      .from(invitations)
      .where(eq(invitations.tokenHash, tokenHash))
      .for('update');
    return row;
  }

  async insert(tx: DbExecutor, values: typeof invitations.$inferInsert) {
    const [row] = await tx.insert(invitations).values(values).returning();
    return row;
  }

  async update(
    tx: DbExecutor,
    id: string,
    set: Partial<typeof invitations.$inferInsert>,
  ) {
    const [row] = await tx
      .update(invitations)
      .set({ ...set, updatedAt: new Date() })
      .where(eq(invitations.id, id))
      .returning();
    return row;
  }

  /** What a token holder may see before signing in: the org, role and inviter. */
  async lookupContext(tokenHash: string) {
    const [row] = await this.db
      .select({
        id: invitations.id,
        email: invitations.email,
        status: invitations.status,
        branchIds: invitations.branchIds,
        expiresAt: invitations.expiresAt,
        createdAt: invitations.createdAt,
        lastSentAt: invitations.lastSentAt,
        organizationName: businesses.name,
        organizationSlug: businesses.slug,
        roleName: roles.name,
        invitedByName: users.name,
      })
      .from(invitations)
      .innerJoin(businesses, eq(businesses.id, invitations.businessId))
      .innerJoin(roles, eq(roles.id, invitations.roleId))
      .leftJoin(users, eq(users.clerkId, invitations.invitedBy))
      .where(eq(invitations.tokenHash, tokenHash));
    return row;
  }

  async branchNames(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];
    const rows = await this.db
      .select({ name: branches.name })
      .from(branches)
      .where(inArray(branches.id, ids));
    return rows.map((r) => r.name);
  }

  async businessOf(tx: DbExecutor, businessId: string) {
    const [row] = await tx
      .select({
        id: businesses.id,
        orgId: businesses.orgId,
        name: businesses.name,
        slug: businesses.slug,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId));
    return row;
  }

  async isMember(tx: DbExecutor, orgId: string, userId: string) {
    const [row] = await tx
      .select({ userId: businessUsers.userClerkId })
      .from(businessUsers)
      .where(
        and(
          eq(businessUsers.businessId, orgId),
          eq(businessUsers.userClerkId, userId),
        ),
      );
    return !!row;
  }

  async ensureUser(tx: DbExecutor, clerkId: string, name: string) {
    await tx
      .insert(users)
      .values({ clerkId, name })
      .onConflictDoNothing({ target: users.clerkId });
  }

  /** Adds the membership and, if the invitation was branch-limited, the limits. */
  async addMember(
    tx: DbExecutor,
    params: {
      orgId: string;
      userId: string;
      roleId: string;
      branchIds: string[];
    },
  ) {
    await tx.insert(businessUsers).values({
      businessId: params.orgId,
      userClerkId: params.userId,
      roleId: params.roleId,
    });
    if (params.branchIds.length > 0) {
      await tx.insert(memberBranches).values(
        params.branchIds.map((branchId) => ({
          userClerkId: params.userId,
          businessId: params.orgId,
          branchId,
        })),
      );
    }
  }

  async markSent(id: string) {
    await this.db
      .update(invitations)
      .set({
        lastSentAt: new Date(),
        sendCount: sql`${invitations.sendCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(invitations.id, id));
  }
}
