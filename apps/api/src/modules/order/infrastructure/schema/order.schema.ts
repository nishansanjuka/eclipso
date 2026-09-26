import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { timestamp } from 'drizzle-orm/pg-core';
import { suppliers } from '../../../suppliers/infrastructure/schema/supplier.schema';
import { pgEnum } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { OrderStatus } from '../enums/order.enum';
import { businesses } from '../../../business/infrastructure/schema/business.schema';
import { branches } from '../../../branch/infrastructure/schema/branch.schema';
import { invoices } from '../../../invoice/infrastructure/schema/invoice.schema';

export const orderStatusEnum = pgEnum('order_status', OrderStatus);

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().unique().notNull(),
  businessId: uuid('business_id')
    .references(() => businesses.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  /** Branch the goods are delivered to when the order is received. */
  branchId: uuid('branch_id')
    .notNull()
    .references(() => branches.id, { onDelete: 'no action' }),
  supplierId: uuid('supplier_id')
    .references(() => suppliers.id, {
      onDelete: 'no action',
    })
    .notNull(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoices.id),
  expectedDate: timestamp('expected_date').notNull(),
  status: orderStatusEnum().notNull().default(OrderStatus.DRAFT),
  totalAmount: integer('total_amount').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
