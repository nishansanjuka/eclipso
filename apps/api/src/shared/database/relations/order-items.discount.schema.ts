import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { orderItems } from '../../../modules/order/infrastructure/schema/order.item.schema';
import { discounts } from '../../../modules/discount/infrastructure/schema/discount.schema';
import { relations } from 'drizzle-orm';

export const orderItemsDiscounts = pgTable(
  'order_items_discounts',
  {
    orderItemId: uuid('order_item_id')
      .references(() => orderItems.id, { onDelete: 'cascade' })
      .notNull(),
    discountId: uuid('discount_id')
      .references(() => discounts.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.orderItemId, table.discountId] })],
);

export const discountsRelations = relations(discounts, ({ many }) => ({
  orderItemLinks: many(orderItemsDiscounts),
}));

export const orderItemsDiscountsRelations = relations(
  orderItemsDiscounts,
  ({ one }) => ({
    orderItem: one(orderItems, {
      fields: [orderItemsDiscounts.orderItemId],
      references: [orderItems.id],
    }),
    discount: one(discounts, {
      fields: [orderItemsDiscounts.discountId],
      references: [discounts.id],
    }),
  }),
);
