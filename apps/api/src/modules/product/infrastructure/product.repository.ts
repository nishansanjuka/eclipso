import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from '../../../shared/database/drizzle.module';
import { ProductCreateDto } from '../dto/product.dto';
import { products } from './schema/product.schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class ProductRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createProduct(productData: ProductCreateDto) {
    return await this.db.insert(products).values(productData).returning();
  }

  async updateProductWithBusinessId(
    id: string,
    businessId: string,
    productData: Partial<ProductCreateDto>,
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
}
