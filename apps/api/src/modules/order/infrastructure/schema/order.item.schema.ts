import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { timestamp } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { orders } from './order.schema';
import { products } from '../../../product/infrastructure/schema/product.schema';

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().unique().notNull(),
  orderId: uuid('order_id')
    .references(() => orders.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  productId: uuid('product_id')
    .references(() => products.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  qty: integer('qty').notNull().default(0),
  price: integer('price').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
