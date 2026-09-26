import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { roles } from '../../../modules/auth/infrastructure/schema/access.schema';
import { users } from '../../../modules/users/infrastructure/schema/user.schema';
import { businesses } from '../../../modules/business/infrastructure/schema/business.schema';
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
  },
  (t) => [primaryKey({ columns: [t.userClerkId, t.businessId] })],
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
