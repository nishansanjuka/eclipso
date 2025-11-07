import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { and, eq } from 'drizzle-orm';
import { sales } from './schema/sale.schema';
import { saleItems } from './schema/sale-item.schema';
import { CreateSaleDto, CreateSaleItemDto } from '../dto/sale.dto';

@Injectable()
export class SaleRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createSale(saleData: Omit<CreateSaleDto, 'items'>) {
    return await this.db.insert(sales).values(saleData).returning();
  }

  async createSaleItem(saleItemData: CreateSaleItemDto & { saleId: string }) {
    return await this.db.insert(saleItems).values(saleItemData).returning();
  }

  async createSaleItems(
    saleItemsData: (CreateSaleItemDto & { saleId: string })[],
  ) {
    return await this.db.insert(saleItems).values(saleItemsData).returning();
  }

  async updateSaleWithBusinessId(
    id: string,
    businessId: string,
    saleData: Partial<Omit<CreateSaleDto, 'items'>>,
  ) {
    return await this.db
      .update(sales)
      .set(saleData)
      .where(and(eq(sales.id, id), eq(sales.businessId, businessId)))
      .returning();
  }

  async updateSaleItem(id: string, saleItemData: Partial<CreateSaleItemDto>) {
    return await this.db
      .update(saleItems)
      .set(saleItemData)
      .where(eq(saleItems.id, id))
      .returning();
  }

  async deleteSaleWithBusinessId(id: string, businessId: string) {
    return await this.db
      .delete(sales)
      .where(and(eq(sales.id, id), eq(sales.businessId, businessId)));
  }

  async deleteSaleItem(id: string) {
    return await this.db.delete(saleItems).where(eq(saleItems.id, id));
  }

  async deleteSaleItemsBySaleId(saleId: string) {
    return await this.db.delete(saleItems).where(eq(saleItems.saleId, saleId));
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
