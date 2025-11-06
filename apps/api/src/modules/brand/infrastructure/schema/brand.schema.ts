import { timestamp } from 'drizzle-orm/pg-core';
import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { businesses } from '../../../business/infrastructure/schema/business.schema';
import { text } from 'drizzle-orm/pg-core';

export const brands = pgTable('brand', {
  id: uuid('id').defaultRandom().unique().notNull(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id, {
      onDelete: 'cascade',
    }),

  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description').notNull(),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
