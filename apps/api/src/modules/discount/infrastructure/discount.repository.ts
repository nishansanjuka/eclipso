import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from '../../../shared/database/drizzle.module';
import { and, eq } from 'drizzle-orm/sql/expressions/conditions';
import { discounts } from './schema/discount.schema';
import { CreateDiscountDto, UpdateDiscountDto } from '../dto/discount.dto';

@Injectable()
export class DiscountRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createDiscount(data: CreateDiscountDto) {
    const result = await this.db.insert(discounts).values(data).returning();
    return result;
  }

  async findDiscountById(id: string) {
    const result = await this.db
      .select()
      .from(discounts)
      .where(eq(discounts.id, id))
      .limit(1)
      .execute();
    return result;
  }

  async updateDiscount(id: string, data: UpdateDiscountDto) {
    const result = await this.db
      .update(discounts)
      .set(data)
      .where(eq(discounts.id, id))
      .returning();
    return result;
  }

  async deleteDiscount(id: string, businessId: string) {
    const result = await this.db
      .delete(discounts)
      .where(and(eq(discounts.id, id), eq(discounts.businessId, businessId)))
      .returning();
    return result;
  }
}
