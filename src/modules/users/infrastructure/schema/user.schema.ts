import { text } from 'drizzle-orm/pg-core';
import { pgTable, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().unique().notNull(),
  businessId: text('business_id').notNull(),
  clerkId: text('clerk_id').notNull().unique(),
  name: text('name').notNull(),
});
