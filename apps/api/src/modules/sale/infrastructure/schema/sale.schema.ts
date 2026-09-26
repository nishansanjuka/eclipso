import {
  pgTable,
  uuid,
  numeric,
  integer,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { businesses } from '../../../business/infrastructure/schema/business.schema';
import { customers } from '../../../customer/infrastructure/schema/customer.schema';
import { users } from '../../../users/infrastructure/schema/user.schema';

export const sales = pgTable(
  'sales',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id')
      .references(() => businesses.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    // Deleting a customer must not delete the sales they appear on.
    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    /** Cashier who rang the sale. Kept (nulled) if the user account goes away. */
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Human-readable, per-business sequential number, e.g. S-000042. */
    receiptNumber: text('receipt_number'),
    /** Client-supplied key that makes a retried POST return the same sale. */
    idempotencyKey: text('idempotency_key'),
    subTotal: numeric('sub_total', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    totalDiscount: numeric('total_discount', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    totalTax: numeric('total_tax', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    /** Grand total: subTotal - totalDiscount + totalTax. Computed server-side. */
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    qty: integer('qty').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('sales_business_receipt_uq').on(t.businessId, t.receiptNumber),
    uniqueIndex('sales_business_idempotency_uq').on(
      t.businessId,
      t.idempotencyKey,
    ),
  ],
);
