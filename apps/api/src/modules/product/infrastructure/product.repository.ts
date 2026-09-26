import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from '../../../shared/database/drizzle.module';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';
import { products } from './schema/product.schema';
import { and, eq, SQL } from 'drizzle-orm';
import { businesses } from '../../business/infrastructure/schema/business.schema';
import { suppliers } from '../../suppliers/infrastructure/schema/supplier.schema';
import { brands } from '../../brand/infrastructure/schema/brand.schema';
import { inventoryMovements } from '../../inventory/infrastructure/schema/inventory.movement.schema';
import { InventoryMovementTypeEnum } from '../../inventory/infrastructure/enums/inventory.movement.enum';

@Injectable()
export class ProductRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  /**
   * Explicit columns only (no client-chosen id or business). Opening stock is
   * written together with a ledger entry, so the ledger always explains the
   * stock on hand.
   */
  async createProduct(productData: CreateProductDto) {
    return await this.db.transaction(async (tx) => {
      const rows = await tx
        .insert(products)
        .values({
          businessId: productData.businessId,
          supplierId: productData.supplierId,
          brandId: productData.brandId ?? null,
          name: productData.name,
          sku: productData.sku,
          price: productData.price ?? 0,
          stockQty: productData.stockQty ?? 0,
          metadata: productData.metadata ?? {},
        })
        .returning();

      const opening = rows[0].stockQty;
      if (opening > 0) {
        await tx.insert(inventoryMovements).values({
          productId: rows[0].id,
          qty: opening,
          movementType: InventoryMovementTypeEnum.ADJUSTMENT,
        });
      }
      return rows;
    });
  }

  async updateProductWithBusinessId(
    id: string,
    businessId: string,
    productData: UpdateProductDto,
  ) {
    // Whitelist: id, business, supplier and stock can never be set from a request.
    const set = {
      ...(productData.name !== undefined && { name: productData.name }),
      ...(productData.sku !== undefined && { sku: productData.sku }),
      ...(productData.price !== undefined && { price: productData.price }),
      ...(productData.brandId !== undefined && {
        brandId: productData.brandId,
      }),
      ...(productData.metadata !== undefined && {
        metadata: productData.metadata,
      }),
      updatedAt: new Date(),
    };
    const [row] = await this.db
      .update(products)
      .set(set)
      .where(and(eq(products.id, id), eq(products.businessId, businessId)))
      .returning();
    return row;
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

  /**
   * True when every given reference exists inside this business, so a product
   * can never point at another tenant's supplier or brand.
   */
  async referencesBelongToBusiness(
    businessId: string,
    refs: { supplierId?: string | null; brandId?: string | null },
  ) {
    if (refs.supplierId) {
      const [supplier] = await this.db
        .select({ id: suppliers.id })
        .from(suppliers)
        .where(
          and(
            eq(suppliers.id, refs.supplierId),
            eq(suppliers.businessId, businessId),
          ),
        );
      if (!supplier) return { ok: false as const, missing: 'Supplier' };
    }
    if (refs.brandId) {
      const [brand] = await this.db
        .select({ id: brands.id })
        .from(brands)
        .where(
          and(eq(brands.id, refs.brandId), eq(brands.businessId, businessId)),
        );
      if (!brand) return { ok: false as const, missing: 'Brand' };
    }
    return { ok: true as const };
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
