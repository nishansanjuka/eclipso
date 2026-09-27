import {
  boolean,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { roles } from '../../../modules/auth/infrastructure/schema/access.schema';
import { users } from '../../../modules/users/infrastructure/schema/user.schema';
import { businesses } from '../../../modules/business/infrastructure/schema/business.schema';
import { branches } from '../../../modules/branch/infrastructure/schema/branch.schema';
import { relations } from 'drizzle-orm';
import { text } from 'drizzle-orm/pg-core';

export const businessUsers = pgTable(
  'business_users',
  {
    userClerkId: text('user_id')
      .notNull()
      .references(() => users.clerkId, { onDelete: 'cascade' }),
    businessId: text('business_id')
      .notNull()
      .references(() => businesses.orgId, { onDelete: 'cascade' }),
    /**
     * Role within this business. Null means "no access": the membership row
     * exists but grants zero permissions until a role is assigned. RESTRICT so
     * a role in use can never be deleted from under a member.
     */
    roleId: uuid('role_id').references(() => roles.id, {
      onDelete: 'restrict',
    }),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    /**
     * Per-business ban, custom to Eclipso (not Clerk's). A banned member keeps
     * their row and role but every request in this business is refused until
     * unbanned. An owner can never be banned (see `assertOwnerRemains`-style
     * guard in `banMember`).
     */
    isBanned: boolean('is_banned').notNull().default(false),
    bannedAt: timestamp('banned_at'),
    bannedBy: text('banned_by').references(() => users.clerkId, {
      onDelete: 'set null',
    }),
    banReason: text('ban_reason'),
  },
  (t) => [primaryKey({ columns: [t.userClerkId, t.businessId] })],
);

/**
 * Optional branch restriction for a member. A member with NO rows here can work
 * in every branch of the business; with rows, only in those branches. Rows are
 * removed automatically with the membership or the branch.
 */
export const memberBranches = pgTable(
  'member_branches',
  {
    userClerkId: text('user_id').notNull(),
    businessId: text('business_id').notNull(),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.userClerkId, t.businessId, t.branchId] }),
    foreignKey({
      columns: [t.userClerkId, t.businessId],
      foreignColumns: [businessUsers.userClerkId, businessUsers.businessId],
      name: 'member_branches_membership_fk',
    }).onDelete('cascade'),
    index('member_branches_branch_idx').on(t.branchId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  businessLinks: many(businessUsers),
}));

export const businessesRelations = relations(businesses, ({ many }) => ({
  userLinks: many(businessUsers),
}));

export const businessUsersRelations = relations(businessUsers, ({ one }) => ({
  user: one(users, {
    fields: [businessUsers.userClerkId],
    references: [users.clerkId],
  }),
  business: one(businesses, {
    fields: [businessUsers.businessId],
    references: [businesses.orgId],
  }),
  role: one(roles, {
    fields: [businessUsers.roleId],
    references: [roles.id],
  }),
}));
