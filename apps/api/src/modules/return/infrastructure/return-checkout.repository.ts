import { Injectable } from '@nestjs/common';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import { type DbExecutor } from '../../../shared/database/drizzle.module';
import { ReturnStatusEnum } from './enums/return.enum';
import { refunds } from './schema/refund.schema';
import { returnItems } from './schema/return-item.schema';
import { returns } from './schema/return.schema';

/** Return-side queries; every method runs on the caller's transaction. */
@Injectable()
export class ReturnCheckoutRepository {
  /** Units already returned per sale line (rejected returns do not count). */
  async returnedQtyBySaleItem(
    tx: DbExecutor,
    saleItemIds: string[],
  ): Promise<Map<string, number>> {
    if (saleItemIds.length === 0) return new Map();
    const rows = await tx
      .select({
        saleItemId: returnItems.saleItemId,
        qty: sql<number>`coalesce(sum(${returnItems.qtyReturned}), 0)::int`,
      })
      .from(returnItems)
      .innerJoin(returns, eq(returns.id, returnItems.returnId))
      .where(
        and(
          inArray(returnItems.saleItemId, saleItemIds),
          ne(returns.status, ReturnStatusEnum.REJECTED),
        ),
      )
      .groupBy(returnItems.saleItemId);
    return new Map(rows.map((r) => [r.saleItemId, r.qty]));
  }

  async insertReturn(tx: DbExecutor, values: typeof returns.$inferInsert) {
    const [row] = await tx.insert(returns).values(values).returning();
    return row;
  }

  insertItems(tx: DbExecutor, values: (typeof returnItems.$inferInsert)[]) {
    return tx.insert(returnItems).values(values).returning();
  }

  async insertRefund(tx: DbExecutor, values: typeof refunds.$inferInsert) {
    const [row] = await tx.insert(refunds).values(values).returning();
    return row;
  }
}
