import { Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceService } from '../infrastructure/invoice.service';
import { OrderService } from '../../order/infrastructure/order.service';

@Injectable()
export class InvoiceGetUsecase {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly orderService: OrderService,
  ) {}

  async execute(invoiceId: string, orgId: string) {
    // Validate order ownership
    const order = await this.orderService.getOrderByInvoiceId(invoiceId, orgId);

    if (!order.id) {
      throw new NotFoundException(
        'Order not found for the authorized organization',
      );
    }

    return await this.invoiceService.getInvoiceDataById(order.invoiceId);
  }
}
