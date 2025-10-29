import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { eq } from 'drizzle-orm';
import { OrderCreateDto } from '../dto/order.dto';
import { orders } from './schema/order.schema';

@Injectable()
export class OrderRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createOrder(orderData: OrderCreateDto) {
    const result = await this.db.insert(orders).values(orderData).returning();
    return result;
  }

  async updateOrderById(orderId: string, orderData: OrderCreateDto) {
    const result = await this.db
      .update(orders)
      .set(orderData)
      .where(eq(orders.id, orderId))
      .returning();
    return result;
  }

  async deleteOrderById(orderId: string) {
    const result = await this.db
      .delete(orders)
      .where(eq(orders.id, orderId))
      .returning();
    return result;
  }
}
