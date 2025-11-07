import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { businesses } from '../../../business/infrastructure/schema/business.schema';
import { users } from '../../../users/infrastructure/schema/user.schema';

export const adjustments = pgTable('adjustments', {
  id: uuid('id').defaultRandom().unique().notNull().primaryKey(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id, {
      onDelete: 'cascade',
    }),
  userId: text('user_id')
    .notNull()
    .references(() => users.clerkId, {
      onDelete: 'cascade',
    }),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
