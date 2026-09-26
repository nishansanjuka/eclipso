import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { and, eq } from 'drizzle-orm';
import { sales } from './schema/sale.schema';
import { saleItems } from './schema/sale-item.schema';
import { SaleStatusEnum } from './enums/sale.enum';

@Injectable()
export class SaleRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async updateSaleWithBusinessId(
    id: string,
    businessId: string,
    saleData: { customerId?: string | null },
  ) {
    return await this.db
      .update(sales)
      .set(saleData)
      .where(
        and(
          eq(sales.id, id),
          eq(sales.businessId, businessId),
          eq(sales.status, SaleStatusEnum.COMPLETED),
        ),
      )
      .returning();
  }

  async getSaleById(id: string, businessId: string) {
    return await this.db
      .select()
      .from(sales)
      .where(and(eq(sales.id, id), eq(sales.businessId, businessId)))
      .limit(1);
  }

  async getSaleItemsBySaleId(saleId: string) {
    return await this.db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, saleId));
  }
}
