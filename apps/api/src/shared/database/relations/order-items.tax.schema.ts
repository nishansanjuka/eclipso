import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { orderItems } from '../../../modules/order/infrastructure/schema/order.item.schema';
import { taxes } from '../../../modules/tax/infrastructure/schema/tax.schema';
import { relations } from 'drizzle-orm';

export const orderItemsTaxes = pgTable(
  'order_items_taxes',
  {
    orderItemId: uuid('order_item_id')
      .references(() => orderItems.id, { onDelete: 'cascade' })
      .notNull(),
    taxId: uuid('tax_id')
      .references(() => taxes.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.orderItemId, table.taxId] })],
);

export const orderItemsRelations = relations(orderItems, ({ many }) => ({
  taxLinks: many(orderItemsTaxes),
}));

export const taxesRelations = relations(taxes, ({ many }) => ({
  orderItemLinks: many(orderItemsTaxes),
}));

export const orderItemsTaxesRelations = relations(
  orderItemsTaxes,
  ({ one }) => ({
    orderItem: one(orderItems, {
      fields: [orderItemsTaxes.orderItemId],
      references: [orderItems.id],
    }),
    tax: one(taxes, {
      fields: [orderItemsTaxes.taxId],
      references: [taxes.id],
    }),
  }),
);
