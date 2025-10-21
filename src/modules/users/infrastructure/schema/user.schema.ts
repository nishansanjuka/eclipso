import { text } from 'drizzle-orm/pg-core';
import { pgTable, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().unique().notNull(),
  businessId: uuid('business_id').notNull(),
  name: text('name').notNull(),
});
