import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from '../../../shared/database/drizzle.module';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';
import { products } from './schema/product.schema';
import { and, eq, SQL } from 'drizzle-orm';
import { businesses } from '../../business/infrastructure/schema/business.schema';

@Injectable()
export class ProductRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createProduct(productData: CreateProductDto) {
    return await this.db.insert(products).values(productData).returning();
  }

  async updateProductWithBusinessId(
    id: string,
    businessId: string,
    productData: UpdateProductDto,
  ) {
    return await this.db
      .update(products)
      .set(productData)
      .where(and(eq(products.id, id), eq(products.businessId, businessId)));
  }

  async deleteProductWithBusinessId(id: string, businessId: string) {
    return await this.db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.businessId, businessId)));
  }

  async getProductIdByIdAndOrgId(id: string, orgId: string) {
    const [res] = await this.db
      .select({
        productId: products.id,
        businessId: businesses.id,
      })
      .from(products)
      .innerJoin(businesses, eq(products.businessId, businesses.id))
      .where(and(eq(products.id, id), eq(businesses.orgId, orgId)));

    return res;
  }

  async updateStockBySql(
    productId: string,
    businessId: string,
    stockQtyExpression: SQL,
  ) {
    const [result] = await this.db
      .update(products)
      .set({
        stockQty: stockQtyExpression,
        updatedAt: new Date(),
      })
      .where(
        and(eq(products.id, productId), eq(products.businessId, businessId)),
      )
      .returning();

    return result;
  }

  async getProductById(id: string, businessId: string) {
    const [result] = await this.db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.businessId, businessId)))
      .limit(1);

    return result;
  }

  async getProductsByIds(ids: string[], businessId: string) {
    return await this.db
      .select()
      .from(products)
      .where(and(eq(products.businessId, businessId)));
  }
}
