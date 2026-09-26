import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { returns } from './schema/return.schema';
import { returnItems } from './schema/return-item.schema';
import { refunds } from './schema/refund.schema';
import {
  CreateRefundDto,
  CreateReturnDto,
  CreateReturnItemDto,
} from '../dto/return.dto';
import { and, eq } from 'drizzle-orm';
import { sales } from '../../sale/infrastructure/schema/sale.schema';

@Injectable()
export class ReturnRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createReturn(
    returnData: Omit<CreateReturnDto, 'items' | 'refund'> & { userId: string },
  ) {
    return await this.db.insert(returns).values(returnData).returning();
  }

  async createReturnItem(
    returnItemData: CreateReturnItemDto & { returnId: string },
  ) {
    return await this.db.insert(returnItems).values(returnItemData).returning();
  }

  async createReturnItems(
    returnItemsData: (CreateReturnItemDto & { returnId: string })[],
  ) {
    return await this.db
      .insert(returnItems)
      .values(returnItemsData)
      .returning();
  }

  async createRefund(
    refundData: CreateRefundDto & { returnId: string; userId: string },
  ) {
    return await this.db.insert(refunds).values(refundData).returning();
  }

  async updateReturn(id: string, returnData: Partial<CreateReturnDto>) {
    return await this.db
      .update(returns)
      .set(returnData)
      .where(eq(returns.id, id))
      .returning();
  }

  async deleteReturn(id: string) {
    return await this.db.delete(returns).where(eq(returns.id, id));
  }

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

  async deleteReturnItemsByReturnId(returnId: string) {
    return await this.db
      .delete(returnItems)
      .where(eq(returnItems.returnId, returnId));
  }
}
