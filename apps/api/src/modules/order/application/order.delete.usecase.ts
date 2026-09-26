import { type BranchScope } from '../../auth/domain/auth-context';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '../infrastructure/enums/order.enum';
import { OrderWorkflowRepository } from '../infrastructure/order-workflow.repository';

// as a business owner, I want to delete an order I created by mistake
@Injectable()
export class OrderDeleteUsecase {
  constructor(private readonly workflow: OrderWorkflowRepository) {}

  async execute(id: string, businessId: string, scope: BranchScope) {
    return this.workflow.transaction(async (tx) => {
      const order = await this.workflow.lockOrder(tx, businessId, id, scope);
      if (!order) throw new NotFoundException('Order not found');
      // A received order is stock history and stays.
      if (order.status === OrderStatus.RECEIVED) {
        throw new ConflictException('A received order cannot be deleted');
      }

      await this.workflow.deleteOrderWithInvoice(tx, order.id, order.invoiceId);
      return { id: order.id };
    });
  }
}
