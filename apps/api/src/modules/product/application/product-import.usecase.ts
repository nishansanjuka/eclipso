import { BadRequestException, Injectable } from '@nestjs/common';
import z from 'zod';
import { BranchStockRepository } from '../../inventory/infrastructure/branch-stock.repository';
import { toMinor } from '../../sale/domain/sale-pricing';
import { ProductImportRepository } from '../infrastructure/product-import.repository';

export const MAX_IMPORT_ROWS = 5000;

const money = z
  .string()
  .trim()
  .regex(/^\d{1,8}(\.\d{1,2})?$/, 'must be an amount like 1250 or 1250.50');

const rowSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(200),
  sku: z.string().trim().min(1, 'sku is required').max(64),
  barcode: z.string().trim().max(64).optional(),
  price: money,
  costPrice: money.optional(),
  category: z.string().trim().max(100).optional(),
  qty: z.number().int().min(0).max(1_000_000).optional(),
});

export const importProductsSchema = z.object({
  rows: z
    .array(z.unknown())
    .min(1, 'There is nothing to import')
    .max(
      MAX_IMPORT_ROWS,
      `Import at most ${MAX_IMPORT_ROWS} products at a time`,
    ),
});

export type ImportRow = z.infer<typeof rowSchema>;

export interface ImportSkip {
  /** 1-based position in the uploaded list. */
  row: number;
  sku: string | null;
  reason: string;
}

/**
 * Bulk product import (CSV from the old till). All-or-nothing: valid rows are
 * created in one transaction and every skipped row says why. Existing SKUs are
 * never overwritten, so re-running an import is harmless.
 *
 * Prices arrive in major units ("1250.50") and are stored in minor units.
 * Products need a supplier, so they go under an "Unassigned" one until the
 * owner reassigns them; opening stock lands in the request's branch.
 */
@Injectable()
export class ProductImportUseCase {
  constructor(
    private readonly repository: ProductImportRepository,
    private readonly stock: BranchStockRepository,
  ) {}

  async execute(
    businessId: string,
    branchId: string | undefined,
    rawRows: unknown[],
  ) {
    const skipped: ImportSkip[] = [];
    const valid: { position: number; row: ImportRow }[] = [];
    const seen = new Set<string>();

    rawRows.forEach((raw, index) => {
      const position = index + 1;
      const parsed = rowSchema.safeParse(raw);
      if (!parsed.success) {
        const sku =
          typeof (raw as { sku?: unknown })?.sku === 'string'
            ? (raw as { sku: string }).sku
            : null;
        skipped.push({
          row: position,
          sku,
          reason: parsed.error.issues
            .map((i) => `${i.path.join('.') || 'row'}: ${i.message}`)
            .join('; '),
        });
        return;
      }
      const key = parsed.data.sku.toLowerCase();
      if (seen.has(key)) {
        skipped.push({
          row: position,
          sku: parsed.data.sku,
          reason: 'Duplicate SKU in this file',
        });
        return;
      }
      seen.add(key);
      valid.push({ position, row: parsed.data });
    });

    const needsStock = valid.some((v) => (v.row.qty ?? 0) > 0);
    if (needsStock && !branchId) {
      throw new BadRequestException(
        'Some rows have stock on hand, which goes into a branch. Send the X-Branch-Id header.',
      );
    }

    const created = await this.repository.transaction(async (tx) => {
      await this.repository.lockBusiness(tx, businessId);
      if (needsStock) {
        await this.stock.assertBranchOperable(tx, businessId, branchId!);
      }

      // SKU match is exact after trimming, like the products table itself.
      const existing = await this.repository.existingSkus(
        tx,
        businessId,
        valid.map((v) => v.row.sku),
      );
      const fresh = valid.filter((v) => {
        if (existing.has(v.row.sku)) {
          skipped.push({
            row: v.position,
            sku: v.row.sku,
            reason: 'A product with this SKU already exists',
          });
          return false;
        }
        return true;
      });
      if (fresh.length === 0) return 0;

      const supplierId = await this.repository.defaultSupplierId(
        tx,
        businessId,
      );
      const categoryIds = await this.repository.categoryIds(
        tx,
        businessId,
        fresh.map((v) => v.row.category ?? ''),
      );

      const inserted = await this.repository.insertProducts(
        tx,
        fresh.map(({ row }) => ({
          businessId,
          supplierId,
          name: row.name,
          sku: row.sku,
          barcode: row.barcode || null,
          price: toMinor(row.price),
          costPrice: row.costPrice ? toMinor(row.costPrice) : null,
        })),
      );
      const idBySku = new Map(inserted.map((p) => [p.sku, p.id]));

      const links = fresh.flatMap(({ row }) => {
        const categoryId = row.category
          ? categoryIds.get(row.category.toLowerCase())
          : undefined;
        return categoryId
          ? [{ productId: idBySku.get(row.sku)!, categoryId }]
          : [];
      });
      await this.repository.linkCategories(tx, links);

      const stocked = fresh
        .filter(({ row }) => (row.qty ?? 0) > 0)
        .map(({ row }) => ({
          productId: idBySku.get(row.sku)!,
          qty: row.qty!,
        }));
      if (stocked.length > 0) {
        await this.repository.openingStock(tx, branchId!, stocked);
      }
      return inserted.length;
    });

    skipped.sort((a, b) => a.row - b.row);
    return { created, skipped, total: rawRows.length };
  }
}
