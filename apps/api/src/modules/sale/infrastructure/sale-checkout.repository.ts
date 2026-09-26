import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import {
  type DbExecutor,
  type DrizzleClient,
} from '../../../shared/database/drizzle.module';
import { businesses } from '../../business/infrastructure/schema/business.schema';
import { customers } from '../../customer/infrastructure/schema/customer.schema';
import { discounts } from '../../discount/infrastructure/schema/discount.schema';
import { inventoryMovements } from '../../inventory/infrastructure/schema/inventory.movement.schema';
import { payments } from '../../payment/infrastructure/schema/payment.schema';
import { products } from '../../product/infrastructure/schema/product.schema';
import { returns } from '../../return/infrastructure/schema/return.schema';
import { ReturnStatusEnum } from '../../return/infrastructure/enums/return.enum';
import { PaymentStatusEnum } from '../../payment/infrastructure/enums/payment.enum';
import { taxes } from '../../tax/infrastructure/schema/tax.schema';
import { users } from '../../users/infrastructure/schema/user.schema';
import { saleItems } from './schema/sale-item.schema';
import { sales } from './schema/sale.schema';
import { SaleStatusEnum } from './enums/sale.enum';

/**
 * Data access for checkout. Every method takes the executor explicitly so the
 * whole sale (numbering, sale, lines, stock, ledger, payment) runs on ONE
 * transaction, and every lookup is scoped by business so ids from the request
 * can never reach another tenant's rows.
 */
@Injectable()
export class SaleCheckoutRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  transaction<T>(fn: (tx: DbExecutor) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) => fn(tx));
  }

  async findByIdempotencyKey(tx: DbExecutor, businessId: string, key: string) {
    const [sale] = await tx
      .select()
      .from(sales)
      .where(
        and(eq(sales.businessId, businessId), eq(sales.idempotencyKey, key)),
      )
      .limit(1);
    return sale;
  }

  async loadBundle(tx: DbExecutor, saleId: string) {
    const [sale] = await tx.select().from(sales).where(eq(sales.id, saleId));
    const items = await tx
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, saleId));
    const movements = await tx
      .select()
      .from(inventoryMovements)
      .where(eq(inventoryMovements.saleId, saleId));
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.saleId, saleId))
      .limit(1);
    return {
      sale,
      items,
      inventoryMovements: movements,
      payment: payment ?? null,
    };
  }

  async findUserIdByClerkId(tx: DbExecutor, clerkId: string) {
    const [row] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId));
    return row?.id;
  }

  loadProducts(tx: DbExecutor, businessId: string, ids: string[]) {
    return tx
      .select()
      .from(products)
      .where(
        and(eq(products.businessId, businessId), inArray(products.id, ids)),
      );
  }

  async loadTaxes(
    tx: DbExecutor,
    businessId: string,
    ids: string[],
  ): Promise<(typeof taxes.$inferSelect)[]> {
    if (ids.length === 0) return [];
    return await tx
      .select()
      .from(taxes)
      .where(and(eq(taxes.businessId, businessId), inArray(taxes.id, ids)));
  }

  async loadDiscounts(
    tx: DbExecutor,
    businessId: string,
    ids: string[],
  ): Promise<(typeof discounts.$inferSelect)[]> {
    if (ids.length === 0) return [];
    return await tx
      .select()
      .from(discounts)
      .where(
        and(eq(discounts.businessId, businessId), inArray(discounts.id, ids)),
      );
  }

  async customerExists(tx: DbExecutor, businessId: string, customerId: string) {
    const [row] = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(eq(customers.businessId, businessId), eq(customers.id, customerId)),
      );
    return !!row;
  }

  /**
   * Next per-business sale number. The UPDATE takes a row lock on the business
   * until the transaction ends, so numbers are gap-free per committed sale and
   * checkouts of one business commit one after another.
   */
  async nextSaleNumber(tx: DbExecutor, businessId: string): Promise<number> {
    const [row] = await tx
      .update(businesses)
      .set({ saleSeq: sql`${businesses.saleSeq} + 1` })
      .where(eq(businesses.id, businessId))
      .returning({ saleSeq: businesses.saleSeq });
    return row.saleSeq;
  }

  async setSaleCustomer(
    tx: DbExecutor,
    saleId: string,
    customerId: string | null,
  ) {
    const [sale] = await tx
      .update(sales)
      .set({ customerId, updatedAt: new Date() })
      .where(eq(sales.id, saleId))
      .returning();
    return sale;
  }

  async insertSale(tx: DbExecutor, values: typeof sales.$inferInsert) {
    const [sale] = await tx.insert(sales).values(values).returning();
    return sale;
  }

  insertItems(tx: DbExecutor, values: (typeof saleItems.$inferInsert)[]) {
    return tx.insert(saleItems).values(values).returning();
  }

  insertMovements(
    tx: DbExecutor,
    values: (typeof inventoryMovements.$inferInsert)[],
  ) {
    return tx.insert(inventoryMovements).values(values).returning();
  }

  async insertPayment(tx: DbExecutor, values: typeof payments.$inferInsert) {
    const [payment] = await tx.insert(payments).values(values).returning();
    return payment;
  }

  // ── shared by returns and voids ──────────────────────────────────────────

  /**
   * Locks the sale row (scoped to the business) for the rest of the
   * transaction, so two returns / a return and a void on the same sale run one
   * after another instead of both passing the same quantity checks.
   */
  async lockSale(tx: DbExecutor, businessId: string, saleId: string) {
    const [sale] = await tx
      .select()
      .from(sales)
      .where(and(eq(sales.id, saleId), eq(sales.businessId, businessId)))
      .for('update');
    return sale;
  }

  loadSaleItems(tx: DbExecutor, saleId: string) {
    return tx.select().from(saleItems).where(eq(saleItems.saleId, saleId));
  }

  async countLiveReturns(tx: DbExecutor, saleId: string): Promise<number> {
    const [row] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(returns)
      .where(
        and(
          eq(returns.saleId, saleId),
          ne(returns.status, ReturnStatusEnum.REJECTED),
        ),
      );
    return row.count;
  }

  async markVoided(
    tx: DbExecutor,
    saleId: string,
    values: { voidedBy: string | null; voidReason: string },
  ) {
    const [sale] = await tx
      .update(sales)
      .set({
        status: SaleStatusEnum.VOIDED,
        voidedAt: new Date(),
        voidedBy: values.voidedBy,
        voidReason: values.voidReason,
        updatedAt: new Date(),
      })
      .where(eq(sales.id, saleId))
      .returning();
    return sale;
  }

  async markPaymentsRefunded(tx: DbExecutor, saleId: string) {
    await tx
      .update(payments)
      .set({ status: PaymentStatusEnum.REFUNDED, updatedAt: new Date() })
      .where(
        and(
          eq(payments.saleId, saleId),
          eq(payments.status, PaymentStatusEnum.COMPLETED),
        ),
      );
  }
}
