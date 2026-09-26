import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { eq } from 'drizzle-orm';
import { orderItems } from './schema/order.item.schema';
import { orderItemsTaxes } from '../../../shared/database/relations/order-items.tax.schema';
import { orderItemsDiscounts } from '../../../shared/database/relations/order-items.discount.schema';

@Injectable()
export class OrderItemRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async getTaxRecordsForOrderItem(orderItemId: string) {
    const result = await this.db
      .select({
        taxId: orderItemsTaxes.taxId,
        orderItemId: orderItemsTaxes.orderItemId,
      })
      .from(orderItemsTaxes)
      .where(eq(orderItemsTaxes.orderItemId, orderItemId));
    return result;
  }

  async getOrderItemsByOrderId(orderId: string) {
    const result = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
    return result;
  }

  async getDiscountRecordsForOrderItem(orderItemId: string) {
    const result = await this.db
      .select({
        discountId: orderItemsDiscounts.discountId,
        orderItemId: orderItemsDiscounts.orderItemId,
      })
      .from(orderItemsDiscounts)
      .where(eq(orderItemsDiscounts.orderItemId, orderItemId));
    return result;
  }

  async getOrderItemsById(id: string) {
    const [result] = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, id));
    return result;
  }
}
