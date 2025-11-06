import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { invoices } from './schema/invoice.schema';
import { InvoiceCreateDto, InvoiceUpdateDto } from '../dto/invoice.dto';
import { eq } from 'drizzle-orm';
import { orders } from '../../order/infrastructure/schema/order.schema';
import { products } from '../../product/infrastructure/schema/product.schema';
import { orderItems } from '../../order/infrastructure/schema/order.item.schema';
import { taxes } from '../../tax/infrastructure/schema/tax.schema';
import { orderItemsTaxes } from '../../../shared/database/relations/order-items.tax.schema';
import { discounts } from '../../discount/infrastructure/schema/discount.schema';
import { orderItemsDiscounts } from '../../../shared/database/relations/order-items.discount.schema';

@Injectable()
export class InvoiceRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createInvoice(data: InvoiceCreateDto) {
    const [result] = await this.db.insert(invoices).values(data).returning();
    return result;
  }

  async findInvoiceByNumber(invoiceNumber: string) {
    const result = await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber))
      .limit(1)
      .execute();
    return result;
  }

  async findInvoiceById(id: string) {
    const result = await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1)
      .execute();
    return result;
  }

  async updateInvoice(id: string, data: InvoiceUpdateDto) {
    const result = await this.db
      .update(invoices)
      .set(data)
      .where(eq(invoices.id, id))
      .returning();
    return result;
  }

  async deleteInvoice(id: string) {
    const result = await this.db
      .delete(invoices)
      .where(eq(invoices.id, id))
      .returning();
    return result;
  }

  async getInvoiceDataById(invoiceId: string) {
    const invoiceWithOrder = await this.db
      .select({
        invoice: invoices,
        order: orders,
      })
      .from(invoices)
      .leftJoin(orders, eq(invoices.id, orders.invoiceId))
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!invoiceWithOrder || invoiceWithOrder.length === 0) {
      return null;
    }

    const { invoice, order } = invoiceWithOrder[0];

    if (!order) {
      return { invoice, order: null, orderItems: [] };
    }

    // Get all order items with product details
    const orderItemsData = await this.db
      .select({
        orderItem: orderItems,
        product: products,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    // Get taxes and discounts for each order item
    const orderItemsWithDetails = await Promise.all(
      orderItemsData.map(async ({ orderItem, product }) => {
        // Get taxes for this order item
        const taxesData = await this.db
          .select({
            tax: taxes,
          })
          .from(orderItemsTaxes)
          .leftJoin(taxes, eq(orderItemsTaxes.taxId, taxes.id))
          .where(eq(orderItemsTaxes.orderItemId, orderItem.id));

        // Get discounts for this order item
        const discountsData = await this.db
          .select({
            discount: discounts,
          })
          .from(orderItemsDiscounts)
          .leftJoin(discounts, eq(orderItemsDiscounts.discountId, discounts.id))
          .where(eq(orderItemsDiscounts.orderItemId, orderItem.id));

        return {
          ...orderItem,
          product,
          taxes: taxesData.map((t) => t.tax).filter(Boolean),
          discounts: discountsData.map((d) => d.discount).filter(Boolean),
        };
      }),
    );

    return {
      invoice,
      order,
      orderItems: orderItemsWithDetails,
    };
  }
}
