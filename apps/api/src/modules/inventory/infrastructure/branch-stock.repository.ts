import { BadRequestException, Injectable } from '@nestjs/common';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import { type DbExecutor } from '../../../shared/database/drizzle.module';
import { branches } from '../../branch/infrastructure/schema/branch.schema';
import { branchStock } from './schema/branch-stock.schema';

/**
 * The only writer of stock quantities. Every method runs on the caller's
 * transaction, and the row-level `qty >= n` predicate (backed by a CHECK) is
 * what stops concurrent checkouts from overselling one branch's shelf.
 */
@Injectable()
export class BranchStockRepository {
  /**
   * The branch must belong to the business and be active: the request's branch
   * comes from a short-lived cache, so stock-changing work re-checks it here.
   */
  async assertBranchOperable(
    tx: DbExecutor,
    businessId: string,
    branchId: string,
  ) {
    const [row] = await tx
      .select({ id: branches.id })
      .from(branches)
      .where(
        and(
          eq(branches.id, branchId),
          eq(branches.businessId, businessId),
          eq(branches.isActive, true),
        ),
      );
    if (!row) {
      throw new BadRequestException('Branch is not available for this action.');
    }
  }

  /** Atomically takes `qty` units; false when the branch does not hold that many. */
  async take(
    tx: DbExecutor,
    branchId: string,
    productId: string,
    qty: number,
  ): Promise<boolean> {
    const rows = await tx
      .update(branchStock)
      .set({ qty: sql`${branchStock.qty} - ${qty}`, updatedAt: new Date() })
      .where(
        and(
          eq(branchStock.branchId, branchId),
          eq(branchStock.productId, productId),
          gte(branchStock.qty, qty),
        ),
      )
      .returning({ productId: branchStock.productId });
    return rows.length === 1;
  }

  /**
   * Puts `qty` (> 0) units on a branch's shelf, creating the row on first use.
   * The product and the branch must belong to the same business, so a stray id
   * can never move stock across tenants; false means they do not.
   */
  async add(
    tx: DbExecutor,
    branchId: string,
    productId: string,
    qty: number,
  ): Promise<boolean> {
    const result = await tx.execute(sql`
      insert into branch_stock (branch_id, product_id, qty)
      select b.id, p.id, ${qty}::int
      from branches b
      join products p on p.business_id = b.business_id
      where b.id = ${branchId} and p.id = ${productId}
      on conflict (branch_id, product_id)
      do update set qty = branch_stock.qty + excluded.qty, updated_at = now()
      returning product_id
    `);
    return result.rows.length === 1;
  }

  /** On-hand quantity per product at one branch (missing = 0). */
  async quantities(
    db: DbExecutor,
    branchId: string,
    productIds: string[],
  ): Promise<Map<string, number>> {
    if (productIds.length === 0) return new Map();
    const rows = await db
      .select({ productId: branchStock.productId, qty: branchStock.qty })
      .from(branchStock)
      .where(
        and(
          eq(branchStock.branchId, branchId),
          inArray(branchStock.productId, productIds),
        ),
      );
    return new Map(rows.map((r) => [r.productId, r.qty]));
  }
}
