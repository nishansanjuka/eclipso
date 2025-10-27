import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { businesses } from '../../../business/infrastructure/schema/business.schema';
import { text } from 'drizzle-orm/pg-core';
import { timestamp } from 'drizzle-orm/pg-core';

export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().unique().notNull(),
  businessId: uuid('business_id')
    .references(() => businesses.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  name: text('name').notNull(),
  contact: text('contact').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
