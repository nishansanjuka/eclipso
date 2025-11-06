import { Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceService } from '../infrastructure/invoice.service';
import { OrderService } from '../../order/infrastructure/order.service';
import { OrderItemService } from '../../order/infrastructure/order-item.service';
import { TaxService } from '../../tax/infrastructure/tax.service';
import { DiscountService } from '../../discount/infrastructure/discount.service';
import { DiscountType } from '../../discount/enums/discount.types.enum';
import { generateInvoicePDF } from '@eclipso/pdf';
import { InvoiceData } from '@eclipso/types';

@Injectable()
export class InvoiceCalculateUsecase {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly orderService: OrderService,
    private readonly orderItemService: OrderItemService,
    private readonly taxService: TaxService,
    private readonly discountService: DiscountService,
  ) {}

  async execute(orderId: string, orgId: string) {
    // Validate order ownership
    const order = await this.orderService.getOrder(orderId, orgId);

    if (!order) {
      throw new NotFoundException(
        'Order not found for the authorized organization',
      );
    }
    // Get all order items for this order
    const orderItemsData =
      await this.orderItemService.getOrderItemsByOrderId(orderId);

    if (!orderItemsData || orderItemsData.length === 0) {
      throw new NotFoundException('No order items found for this order');
    }

    let subTotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    // Calculate for each order item
    for (const orderItem of orderItemsData) {
      const itemSubtotal = orderItem.price * orderItem.qty;
      subTotal += itemSubtotal;

      // Get taxes for this order item
      const taxRecords = await this.orderItemService.getTaxRecordsForOrderItem(
        orderItem.id,
      );

      for (const taxRecord of taxRecords) {
        const tax = await this.taxService.getTaxById(taxRecord.taxId);
        if (tax && tax.isActive) {
          // Calculate tax amount (rate is stored as percentage)
          const taxAmount = (itemSubtotal * tax.rate) / 100;
          totalTax += taxAmount;
        }
      }

      // Get discounts for this order item
      const discountRecords =
        await this.orderItemService.getDiscountRecordsForOrderItem(
          orderItem.id,
        );

      for (const discountRecord of discountRecords) {
        const discount = await this.discountService.getDiscountById(
          discountRecord.discountId,
        );
        if (discount && discount.isActive) {
          // Calculate discount amount based on type
          let discountAmount = 0;
          if (discount.type === DiscountType.PERCENTAGE) {
            discountAmount = (itemSubtotal * discount.value) / 100;
          } else if (discount.type === DiscountType.FIXED) {
            discountAmount = discount.value;
          }
          totalDiscount += discountAmount;
        }
      }
    }

    // Calculate grand total
    const grandTotal = subTotal + totalTax - totalDiscount;

    // Update invoice with calculated values
    const invoiceData = {
      subTotal,
      totalTax,
      totalDiscount,
      grandTotal,
    };

    await this.invoiceService.updateInvoice(order.invoiceId, invoiceData);

    const data = await this.invoiceService.getInvoiceDataById(order.invoiceId);

    const invoice = await generateInvoicePDF(data as InvoiceData, {
      currency: 'LKR',
      locale: 'si-LK',
    });

    console.log(invoice);

    return invoice;
  }
}
