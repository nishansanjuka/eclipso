import { timestamp } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { businesses } from '../../../business/infrastructure/schema/business.schema';
import { boolean } from 'drizzle-orm/pg-core';

export const discounts = pgTable('discount', {
  id: uuid('id').defaultRandom().unique().notNull(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id),
  name: text('name').notNull(),
  value: integer('value').notNull().default(0),
  type: text('type').notNull(),
  start: timestamp('start').notNull(),
  end: timestamp('end').notNull(),
  isActive: boolean('is_active').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
