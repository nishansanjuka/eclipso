import { integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { returns } from './return.schema';
import { saleItems } from '../../../sale/infrastructure/schema/sale-item.schema';

export const returnItems = pgTable('return_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  returnId: uuid('return_id')
    .notNull()
    .references(() => returns.id, { onDelete: 'cascade' }),
  saleItemId: uuid('sale_item_id')
    .notNull()
    .references(() => saleItems.id, { onDelete: 'cascade' }),
  qtyReturned: integer('qty_returned').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
