import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { and, eq } from 'drizzle-orm';
import { CreateOrderDto, UpdateOrderDto } from '../dto/order.dto';
import { orders } from './schema/order.schema';
import { businesses } from '../../business/infrastructure/schema/business.schema';

@Injectable()
export class OrderRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createOrder(orderData: CreateOrderDto) {
    const result = await this.db.insert(orders).values(orderData).returning();
    return result;
  }

  async updateOrderById(orderId: string, orderData: UpdateOrderDto) {
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

  async getOrderById(orderId: string, orgId: string) {
    const [result] = await this.db
      .select({
        order: orders,
      })
      .from(orders)
      .innerJoin(businesses, eq(orders.businessId, businesses.id))
      .where(and(eq(orders.id, orderId), eq(businesses.orgId, orgId)));

    return result?.order;
  }

  async getOrderByInvoiceId(invoiceId: string, orgId: string) {
    const [result] = await this.db
      .select({
        order: orders,
      })
      .from(orders)
      .innerJoin(businesses, eq(orders.businessId, businesses.id))
      .where(and(eq(orders.invoiceId, invoiceId), eq(businesses.orgId, orgId)));
    return result?.order;
  }
}
