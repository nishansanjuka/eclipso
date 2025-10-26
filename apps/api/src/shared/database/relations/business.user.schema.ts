import { pgTable, primaryKey } from 'drizzle-orm/pg-core';
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
}));
