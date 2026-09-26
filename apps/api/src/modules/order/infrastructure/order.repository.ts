import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { and, eq } from 'drizzle-orm';
import { orders } from './schema/order.schema';
import { businesses } from '../../business/infrastructure/schema/business.schema';

@Injectable()
export class OrderRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

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
