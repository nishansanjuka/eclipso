import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { and, eq } from 'drizzle-orm';
import { CreateOrderItemDto, UpdateOrderItemDto } from '../dto/order-item.dto';
import { orderItems } from './schema/order.item.schema';
import { products } from '../../product/infrastructure/schema/product.schema';
import { businesses } from '../../business/infrastructure/schema/business.schema';
import { orderItemsTaxes } from '../../../shared/database/relations/order-items.tax.schema';
import { orderItemsDiscounts } from '../../../shared/database/relations/order-items.discount.schema';

@Injectable()
export class OrderItemRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createOrderItem(orderItemData: CreateOrderItemDto) {
    const result = await this.db
      .insert(orderItems)
      .values(orderItemData)
      .returning();
    return result;
  }

  async updateOrderItemById(
    orderItemId: string,
    orderItemData: UpdateOrderItemDto,
  ) {
    const result = await this.db
      .update(orderItems)
      .set(orderItemData)
      .where(eq(orderItems.id, orderItemId))
      .returning();
    return result;
  }

  async deleteOrderItemById(orderItemId: string) {
    const result = await this.db
      .delete(orderItems)
      .where(eq(orderItems.id, orderItemId))
      .returning();
    return result;
  }

  async validateOrderItemOwnership(
    orderItemId: string,
    orgId: string,
  ): Promise<boolean> {
    const result = await this.db
      .select({
        orderItemId: orderItems.id,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(businesses, eq(products.businessId, businesses.id))
      .where(and(eq(orderItems.id, orderItemId), eq(businesses.orgId, orgId)))
      .limit(1);
    return result.length > 0;
  }

  async addTaxRecordsToOrderItem(orderItemId: string, taxIds: string[]) {
    const taxRecords = taxIds.map((taxId) => ({
      orderItemId,
      taxId,
    }));

    const result = await this.db
      .insert(orderItemsTaxes)
      .values(taxRecords)
      .returning();
    return result;
  }

  async removeTaxRecordsFromOrderItem(orderItemId: string, taxIds?: string[]) {
    if (taxIds && taxIds.length > 0) {
      const result = await this.db
        .delete(orderItemsTaxes)
        .where(and(eq(orderItemsTaxes.orderItemId, orderItemId)))
        .returning();
      return result;
    } else {
      const result = await this.db
        .delete(orderItemsTaxes)
        .where(eq(orderItemsTaxes.orderItemId, orderItemId))
        .returning();
      return result;
    }
  }

  async getTaxRecordsForOrderItem(orderItemId: string) {
    const result = await this.db
      .select({
        taxId: orderItemsTaxes.taxId,
        orderItemId: orderItemsTaxes.orderItemId,
      })
      .from(orderItemsTaxes)
      .where(eq(orderItemsTaxes.orderItemId, orderItemId));
    return result;
  }

  async addDiscountRecordsToOrderItem(
    orderItemId: string,
    discountIds: string[],
  ) {
    const discountRecords = discountIds.map((discountId) => ({
      orderItemId,
      discountId,
    }));

    const result = await this.db
      .insert(orderItemsDiscounts)
      .values(discountRecords)
      .returning();
    return result;
  }

  async removeDiscountRecordsFromOrderItem(
    orderItemId: string,
    discountIds?: string[],
  ) {
    if (discountIds && discountIds.length > 0) {
      const result = await this.db
        .delete(orderItemsDiscounts)
        .where(and(eq(orderItemsDiscounts.orderItemId, orderItemId)))
        .returning();
      return result;
    } else {
      const result = await this.db
        .delete(orderItemsDiscounts)
        .where(eq(orderItemsDiscounts.orderItemId, orderItemId))
        .returning();
      return result;
    }
  }

  async getOrderItemsByOrderId(orderId: string) {
    const result = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
    return result;
  }

  async getDiscountRecordsForOrderItem(orderItemId: string) {
    const result = await this.db
      .select({
        discountId: orderItemsDiscounts.discountId,
        orderItemId: orderItemsDiscounts.orderItemId,
      })
      .from(orderItemsDiscounts)
      .where(eq(orderItemsDiscounts.orderItemId, orderItemId));
    return result;
  }
}
