import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { businesses } from '../../../business/infrastructure/schema/business.schema';
import { timestamp } from 'drizzle-orm/pg-core';
import { suppliers } from '../../../suppliers/infrastructure/schema/supplier.schema';
import { integer } from 'drizzle-orm/pg-core';

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().unique().notNull(),
  orderId: uuid('order_id')
    .references(() => businesses.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  productId: uuid('product_id')
    .references(() => suppliers.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  qty: integer('qty').notNull().default(0),
  price: integer('price').notNull().default(0),
  tax: integer('tax').notNull().default(0),
  discount: integer('discount').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
