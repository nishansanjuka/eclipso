import { type BranchScope } from '../../auth/domain/auth-context';
import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderWorkflowRepository } from '../infrastructure/order-workflow.repository';
import { assertDraft } from './order-guards';

// as a business owner, I want to remove a line from a draft purchase order
@Injectable()
export class OrderItemDeleteUsecase {
  constructor(private readonly workflow: OrderWorkflowRepository) {}

  async execute(id: string, businessId: string, scope: BranchScope) {
    return this.workflow.transaction(async (tx) => {
      const order = await this.workflow.lockOrderOfItem(
        tx,
        businessId,
        id,
        scope,
      );
      if (!order) throw new NotFoundException('Order item not found');
      assertDraft(order);

      await this.workflow.deleteItem(tx, id);
      await this.workflow.recomputeTotal(tx, order.id);
      return { id };
    });
  }
}
