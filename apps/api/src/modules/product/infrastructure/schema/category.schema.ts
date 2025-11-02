/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { text, timestamp } from 'drizzle-orm/pg-core';
import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { businesses } from '../../../business/infrastructure/schema/business.schema';

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().unique().notNull(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id, {
      onDelete: 'cascade',
    }),
  name: text('name').notNull(),
  parentId: uuid('parent_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
