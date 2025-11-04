import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { and, eq } from 'drizzle-orm';
import { OrderCreateDto, OrderUpdateDto } from '../dto/order.dto';
import { orders } from './schema/order.schema';

@Injectable()
export class OrderRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createOrder(orderData: OrderCreateDto) {
    const result = await this.db.insert(orders).values(orderData).returning();
    return result;
  }

  async updateOrderById(orderId: string, orderData: OrderUpdateDto) {
    const result = await this.db
      .update(orders)
      .set(orderData)
      .where(eq(orders.id, orderId))
      .returning();
    return result;
  }

  async deleteOrderById(orderId: string, businessId: string) {
    const result = await this.db
      .delete(orders)
      .where(and(eq(orders.id, orderId), eq(orders.businessId, businessId)))
      .returning();
    return result;
  }

  async getOrderById(orderId: string, businessId: string) {
    const [result] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.businessId, businessId)));
    return result;
  }
}
