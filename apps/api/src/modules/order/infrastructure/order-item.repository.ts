import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { eq } from 'drizzle-orm';
import { OrderItemCreateDto } from '../dto/order-item.dto';
import { orderItems } from './schema/order.item.schema';

@Injectable()
export class OrderItemRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createOrderItem(orderItemData: OrderItemCreateDto) {
    const result = await this.db
      .insert(orderItems)
      .values(orderItemData)
      .returning();
    return result;
  }

  async updateOrderItemById(
    orderItemId: string,
    orderItemData: OrderItemCreateDto,
  ) {
    const result = await this.db
      .update(orderItems)
      .set(orderItemData)
      .where(eq(orderItems.id, orderItemId))
      .returning();
    return result;
  }

  async deleteOrderItemById(orderItemId: string) {
    const result = await this.db
      .delete(orderItems)
      .where(eq(orderItems.id, orderItemId))
      .returning();
    return result;
  }
}
