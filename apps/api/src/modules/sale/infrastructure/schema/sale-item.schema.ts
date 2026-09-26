import {
  pgTable,
  uuid,
  numeric,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';
import { sales } from './sale.schema';
import { products } from '../../../product/infrastructure/schema/product.schema';
import { discounts } from '../../../discount/infrastructure/schema/discount.schema';
import { taxes } from '../../../tax/infrastructure/schema/tax.schema';

export const saleItems = pgTable('sale_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  saleId: uuid('sale_id')
    .references(() => sales.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  // A product that has been sold can no longer be deleted (NO ACTION rather
  // than RESTRICT so deleting a whole business can still cascade).
  productId: uuid('product_id')
    .references(() => products.id, {
      onDelete: 'no action',
    })
    .notNull(),
  discountId: uuid('discount_id').references(() => discounts.id, {
    onDelete: 'set null',
  }),
  taxId: uuid('tax_id').references(() => taxes.id, {
    onDelete: 'set null',
  }),
  qty: integer('qty').notNull().default(1),
  /** Unit price at the time of sale (copied from the product, not the client). */
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
