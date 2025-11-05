import { Inject, Injectable } from '@nestjs/common';
import { desc, sql } from 'drizzle-orm';
import { products } from '../../modules/product/infrastructure/schema/product.schema';
import { type DrizzleClient } from '../database/drizzle.module';

@Injectable()
export class SkuGeneratorService {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async generateSku(baseSku: string, businessId: string): Promise<string> {
    // Find the latest SKU with the same base pattern
    const latestProduct = await this.db
      .select({ sku: products.sku })
      .from(products)
      .where(
        sql`${products.businessId} = ${businessId} AND ${products.sku} LIKE ${baseSku + '-%'}`,
      )
      .orderBy(desc(products.sku))
      .limit(1);

    if (latestProduct.length === 0) {
      // First product with this base SKU
      return `${baseSku}-001`;
    }

    // Extract the number from the last SKU
    const lastSku = latestProduct[0].sku;
    const match = lastSku.match(/-(\d+)$/);

    if (!match) {
      // If no number found, start from 001
      return `${baseSku}-001`;
    }

    const lastNumber = parseInt(match[1], 10);
    const nextNumber = lastNumber + 1;

    // Pad with zeros to maintain 3 digits
    return `${baseSku}-${nextNumber.toString().padStart(3, '0')}`;
  }
}
