import { relations } from 'drizzle-orm';
import { invoices } from '../../../modules/invoice/infrastructure/schema/invoice.schema';
import { orders } from '../../../modules/order/infrastructure/schema/order.schema';

// Relations: invoice -> orders (one-to-many)
export const invoiceRelations = relations(invoices, ({ many }) => ({
  orders: many(orders),
}));

// Relations: order -> invoice (many-to-one)
export const orderRelations = relations(orders, ({ one }) => ({
  invoice: one(invoices, {
    fields: [orders.invoiceId],
    references: [invoices.id],
  }),
}));
