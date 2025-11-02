import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { timestamp } from 'drizzle-orm/pg-core';
import { suppliers } from '../../../suppliers/infrastructure/schema/supplier.schema';
import { pgEnum } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { OrderStatus } from '../enums/order.enum';
import { businesses } from '../../../business/infrastructure/schema/business.schema';
import { invoices } from '../../../invoice/infrastructure/schema/invoice.schema';

export const orderStatusEnum = pgEnum('order_status', OrderStatus);

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().unique().notNull(),
  businessId: uuid('business_id')
    .references(() => businesses.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  supplierId: uuid('supplier_id')
    .references(() => suppliers.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoices.id),
  expireDate: timestamp('expire_date').notNull(),
  status: orderStatusEnum().notNull().default(OrderStatus.DRAFT),
  totalAmount: integer('total_amount').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
