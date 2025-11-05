import { relations } from 'drizzle-orm';
import { orderItems } from '../../../modules/order/infrastructure/schema/order.item.schema';
import { orders } from '../../../modules/order/infrastructure/schema/order.schema';
import { products } from '../../../modules/product/infrastructure/schema/product.schema';
import { orderItemsTaxes } from './order-items.tax.schema';
import { orderItemsDiscounts } from './order-items.discount.schema';

export const orderItemsRelations = relations(orderItems, ({ many, one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  taxLinks: many(orderItemsTaxes),
  discountLinks: many(orderItemsDiscounts),
}));
