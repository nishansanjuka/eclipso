import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { text } from 'drizzle-orm/pg-core';
import { invoices } from '../../../modules/invoice/infrastructure/schema/invoice.schema';
import { orders } from '../../../modules/order/infrastructure/schema/order.schema';

export const invoiceOrder = pgTable(
  'invoice_order',
  {
    id: uuid('id').defaultRandom().unique().notNull().primaryKey(),
    invoiceId: text('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.invoiceId, t.orderId] })],
);

export const invoiceRelations = relations(invoices, ({ one }) => ({
  orderLinks: one(invoiceOrder),
}));

export const orderRelations = relations(orders, ({ one }) => ({
  invoiceLinks: one(invoiceOrder),
}));

export const invoiceOrderRelations = relations(invoiceOrder, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceOrder.invoiceId],
    references: [invoices.id],
  }),
  order: one(orders, {
    fields: [invoiceOrder.orderId],
    references: [orders.id],
  }),
}));
