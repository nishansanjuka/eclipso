import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { returns } from './schema/return.schema';
import { returnItems } from './schema/return-item.schema';
import { refunds } from './schema/refund.schema';
import { and, eq } from 'drizzle-orm';
import { sales } from '../../sale/infrastructure/schema/sale.schema';

@Injectable()
export class ReturnRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  /** Scoped through the sale: a return belongs to the business that made the sale. */
  async getReturnById(id: string, businessId: string) {
    const [result] = await this.db
      .select({ returnRecord: returns })
      .from(returns)
      .innerJoin(sales, eq(sales.id, returns.saleId))
      .where(and(eq(returns.id, id), eq(sales.businessId, businessId)))
      .limit(1);
    return result?.returnRecord;
  }

  async getReturnItemsByReturnId(returnId: string) {
    return await this.db
      .select()
      .from(returnItems)
      .where(eq(returnItems.returnId, returnId));
  }

  async getRefundByReturnId(returnId: string) {
    const [result] = await this.db
      .select()
      .from(refunds)
      .where(eq(refunds.returnId, returnId))
      .limit(1);
    return result;
  }
}
