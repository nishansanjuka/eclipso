import { Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceService } from '../infrastructure/invoice.service';
import { OrderService } from '../../order/infrastructure/order.service';
import { type BranchScope } from '../../auth/domain/auth-context';

@Injectable()
export class InvoiceGetUsecase {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly orderService: OrderService,
  ) {}

  async execute(invoiceId: string, orgId: string, scope: BranchScope) {
    // Validate order ownership
    const order = await this.orderService.getOrderByInvoiceId(invoiceId, orgId);

    // Same answer for "missing" and "another branch's order".
    if (!order || !scope.canAccessBranch(order.branchId)) {
      throw new NotFoundException(
        'Order not found for the authorized organization',
      );
    }

    return await this.invoiceService.getInvoiceDataById(order.invoiceId);
  }
}
