import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  type DbExecutor,
  type DrizzleClient,
} from '../../../shared/database/drizzle.module';
import { productCategory } from '../../../shared/database/relations/product.category.schema';
import { branchStock } from '../../inventory/infrastructure/schema/branch-stock.schema';
import { inventoryMovements } from '../../inventory/infrastructure/schema/inventory.movement.schema';
import { InventoryMovementTypeEnum } from '../../inventory/infrastructure/enums/inventory.movement.enum';
import { suppliers } from '../../suppliers/infrastructure/schema/supplier.schema';
import { categories } from './schema/category.schema';
import { products } from './schema/product.schema';

const CHUNK = 500;

function chunks<T>(items: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += CHUNK)
    out.push(items.slice(i, i + CHUNK));
  return out;
}

/** Bulk writes for CSV import; every method runs on the caller's transaction. */
@Injectable()
export class ProductImportRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  transaction<T>(fn: (tx: DbExecutor) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) => fn(tx));
  }

  /** Serializes imports for one business so two uploads cannot both create the same SKU. */
  async lockBusiness(tx: DbExecutor, businessId: string) {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${'product-import:' + businessId}))`,
    );
  }

  async existingSkus(
    tx: DbExecutor,
    businessId: string,
    skus: string[],
  ): Promise<Set<string>> {
    const found = new Set<string>();
    for (const part of chunks(skus)) {
      const rows = await tx
        .select({ sku: products.sku })
        .from(products)
        .where(
          and(eq(products.businessId, businessId), inArray(products.sku, part)),
        );
      for (const r of rows) found.add(r.sku);
    }
    return found;
  }

  /** Products need a supplier; imports without one go under "Unassigned". */
  async defaultSupplierId(tx: DbExecutor, businessId: string) {
    const [existing] = await tx
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(
        and(
          eq(suppliers.businessId, businessId),
          eq(suppliers.name, 'Unassigned'),
        ),
      );
    if (existing) return existing.id;
    const [created] = await tx
      .insert(suppliers)
      .values({
        businessId,
        name: 'Unassigned',
        contact: '-',
        description: 'Created by product import; reassign products when known.',
      })
      .returning({ id: suppliers.id });
    return created.id;
  }

  /** Category name (case-insensitive) -> id, creating the missing ones. */
  async categoryIds(
    tx: DbExecutor,
    businessId: string,
    names: string[],
  ): Promise<Map<string, string>> {
    const wanted = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
    const existing = await tx
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.businessId, businessId));
    const byLower = new Map(existing.map((c) => [c.name.toLowerCase(), c.id]));

    // "Apparel" and "apparel" in one file are one category (first spelling wins).
    const missing = [
      ...new Map(
        wanted
          .filter((n) => !byLower.has(n.toLowerCase()))
          .map((n) => [n.toLowerCase(), n]),
      ).values(),
    ];
    if (missing.length > 0) {
      const created = await tx
        .insert(categories)
        .values(missing.map((name) => ({ businessId, name })))
        .returning({ id: categories.id, name: categories.name });
      for (const c of created) byLower.set(c.name.toLowerCase(), c.id);
    }
    return byLower;
  }

  async insertProducts(
    tx: DbExecutor,
    rows: (typeof products.$inferInsert)[],
  ): Promise<{ id: string; sku: string }[]> {
    const out: { id: string; sku: string }[] = [];
    for (const part of chunks(rows)) {
      out.push(
        ...(await tx
          .insert(products)
          .values(part)
          .returning({ id: products.id, sku: products.sku })),
      );
    }
    return out;
  }

  async linkCategories(
    tx: DbExecutor,
    links: { productId: string; categoryId: string }[],
  ) {
    for (const part of chunks(links)) {
      await tx.insert(productCategory).values(part).onConflictDoNothing();
    }
  }

  /** Opening stock for brand-new products: no prior stock rows can exist. */
  async openingStock(
    tx: DbExecutor,
    branchId: string,
    items: { productId: string; qty: number }[],
  ) {
    for (const part of chunks(items)) {
      await tx
        .insert(branchStock)
        .values(
          part.map((i) => ({ branchId, productId: i.productId, qty: i.qty })),
        );
      await tx.insert(inventoryMovements).values(
        part.map((i) => ({
          branchId,
          productId: i.productId,
          qty: i.qty,
          movementType: InventoryMovementTypeEnum.ADJUSTMENT,
        })),
      );
    }
  }
}
