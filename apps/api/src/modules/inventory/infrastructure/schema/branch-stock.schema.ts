import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { branches } from '../../../branch/infrastructure/schema/branch.schema';
import { products } from '../../../product/infrastructure/schema/product.schema';

/**
 * Stock on hand per branch. This is the only place quantities live: a product
 * belongs to the whole business, its stock to a branch. A missing row means
 * zero. Rows change only through the inventory ledger (sales, returns, voids,
 * purchase receiving, adjustments), and the CHECK makes overselling impossible
 * even if a code path forgets to guard.
 */
export const branchStock = pgTable(
  'branch_stock',
  {
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    qty: integer('qty').notNull().default(0),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.branchId, t.productId] }),
    index('branch_stock_product_idx').on(t.productId),
    check('branch_stock_qty_non_negative', sql`${t.qty} >= 0`),
  ],
);
