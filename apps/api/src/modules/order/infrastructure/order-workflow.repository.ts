import { type BranchScope } from '../../auth/domain/auth-context';
import { branchScopeCondition } from '../../../shared/utils/branch-filter';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import {
  type DbExecutor,
  type DrizzleClient,
} from '../../../shared/database/drizzle.module';
import { discounts } from '../../discount/infrastructure/schema/discount.schema';
import { invoices } from '../../invoice/infrastructure/schema/invoice.schema';
import { products } from '../../product/infrastructure/schema/product.schema';
import { suppliers } from '../../suppliers/infrastructure/schema/supplier.schema';
import { taxes } from '../../tax/infrastructure/schema/tax.schema';
import { orderItemsDiscounts } from '../../../shared/database/relations/order-items.discount.schema';
import { orderItemsTaxes } from '../../../shared/database/relations/order-items.tax.schema';
import { OrderStatus } from './enums/order.enum';
import { orderItems } from './schema/order.item.schema';
import { orders } from './schema/order.schema';

/**
 * Purchase-order data access. Every method takes the executor so a workflow
 * (create, edit items, receive, ...) runs on one transaction, and every lookup
 * is scoped by business so ids from the request cannot reach another tenant.
 */
@Injectable()
export class OrderWorkflowRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  transaction<T>(fn: (tx: DbExecutor) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) => fn(tx));
  }

  /**
   * Locks the order row (scoped to the business) until the transaction ends, so
   * item edits, status changes and receiving on one order run one at a time.
   */
  async lockOrder(
    tx: DbExecutor,
    businessId: string,
    orderId: string,
    scope: BranchScope,
  ) {
    const [order] = await tx
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.businessId, businessId),
          // A branch-limited member cannot see other branches' orders.
          branchScopeCondition(orders.branchId, scope),
        ),
      )
      .for('update');
    return order;
  }

  /** Locks the order that owns an item; undefined if the item is not this business's. */
  async lockOrderOfItem(
    tx: DbExecutor,
    businessId: string,
    itemId: string,
    scope: BranchScope,
  ) {
    const [row] = await tx
      .select({ orderId: orderItems.orderId })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(eq(orderItems.id, itemId), eq(orders.businessId, businessId)));
    if (!row) return undefined;
    return this.lockOrder(tx, businessId, row.orderId, scope);
  }

  async supplierInBusiness(
    tx: DbExecutor,
    businessId: string,
    supplierId: string,
  ) {
    const [row] = await tx
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(
        and(eq(suppliers.id, supplierId), eq(suppliers.businessId, businessId)),
      );
    return !!row;
  }

  async taxInBusiness(tx: DbExecutor, businessId: string, taxId: string) {
    const [row] = await tx
      .select({ id: taxes.id })
      .from(taxes)
      .where(and(eq(taxes.id, taxId), eq(taxes.businessId, businessId)));
    return !!row;
  }

  async discountInBusiness(
    tx: DbExecutor,
    businessId: string,
    discountId: string,
  ) {
    const [row] = await tx
      .select({ id: discounts.id })
      .from(discounts)
      .where(
        and(eq(discounts.id, discountId), eq(discounts.businessId, businessId)),
      );
    return !!row;
  }

  async loadProduct(tx: DbExecutor, businessId: string, productId: string) {
    const [product] = await tx
      .select()
      .from(products)
      .where(
        and(eq(products.id, productId), eq(products.businessId, businessId)),
      );
    return product;
  }

  async findItem(tx: DbExecutor, orderId: string, itemId: string) {
    const [item] = await tx
      .select()
      .from(orderItems)
      .where(and(eq(orderItems.id, itemId), eq(orderItems.orderId, orderId)));
    return item;
  }

  itemsOf(tx: DbExecutor, orderId: string) {
    return tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async orderHasProduct(tx: DbExecutor, orderId: string, productId: string) {
    const [row] = await tx
      .select({ id: orderItems.id })
      .from(orderItems)
      .where(
        and(
          eq(orderItems.orderId, orderId),
          eq(orderItems.productId, productId),
        ),
      );
    return !!row;
  }

  // ── writes ────────────────────────────────────────────────────────────────

  /** Every order owns exactly one invoice; both are created together. */
  async insertOrderWithInvoice(
    tx: DbExecutor,
    values: Omit<typeof orders.$inferInsert, 'invoiceId'>,
  ) {
    const [invoice] = await tx.insert(invoices).values({}).returning();
    const [order] = await tx
      .insert(orders)
      .values({ ...values, invoiceId: invoice.id })
      .returning();
    return order;
  }

  async updateOrder(
    tx: DbExecutor,
    orderId: string,
    set: Partial<Pick<typeof orders.$inferInsert, 'expectedDate' | 'status'>>,
  ) {
    const [order] = await tx
      .update(orders)
      .set({ ...set, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }

  async deleteOrderWithInvoice(
    tx: DbExecutor,
    orderId: string,
    invoiceId: string,
  ) {
    await tx.delete(orders).where(eq(orders.id, orderId));
    await tx.delete(invoices).where(eq(invoices.id, invoiceId));
  }

  async insertItem(tx: DbExecutor, values: typeof orderItems.$inferInsert) {
    const [item] = await tx.insert(orderItems).values(values).returning();
    return item;
  }

  async updateItem(
    tx: DbExecutor,
    itemId: string,
    set: { qty?: number; price?: number },
  ) {
    const [item] = await tx
      .update(orderItems)
      .set({ ...set, updatedAt: new Date() })
      .where(eq(orderItems.id, itemId))
      .returning();
    return item;
  }

  async deleteItem(tx: DbExecutor, itemId: string) {
    await tx.delete(orderItems).where(eq(orderItems.id, itemId));
  }

  /** The order total is always the sum of its lines, never a client value. */
  async recomputeTotal(tx: DbExecutor, orderId: string) {
    const [order] = await tx
      .update(orders)
      .set({
        totalAmount: sql`coalesce((select sum(${orderItems.qty}::bigint * ${orderItems.price}) from ${orderItems} where ${orderItems.orderId} = ${orders.id}), 0)::int`,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }

  async addItemTax(tx: DbExecutor, orderItemId: string, taxId: string) {
    await tx
      .insert(orderItemsTaxes)
      .values({ orderItemId, taxId })
      .onConflictDoNothing();
  }

  async removeItemTax(tx: DbExecutor, orderItemId: string, taxId: string) {
    await tx
      .delete(orderItemsTaxes)
      .where(
        and(
          eq(orderItemsTaxes.orderItemId, orderItemId),
          eq(orderItemsTaxes.taxId, taxId),
        ),
      );
  }

  async addItemDiscount(
    tx: DbExecutor,
    orderItemId: string,
    discountId: string,
  ) {
    await tx
      .insert(orderItemsDiscounts)
      .values({ orderItemId, discountId })
      .onConflictDoNothing();
  }

  async removeItemDiscount(
    tx: DbExecutor,
    orderItemId: string,
    discountId: string,
  ) {
    await tx
      .delete(orderItemsDiscounts)
      .where(
        and(
          eq(orderItemsDiscounts.orderItemId, orderItemId),
          eq(orderItemsDiscounts.discountId, discountId),
        ),
      );
  }
}

export { OrderStatus };
