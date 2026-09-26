import { type BranchScope } from '../../auth/domain/auth-context';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateOrderItemDto } from '../dto/order-item.dto';
import { OrderItemUpdateEntity } from '../domain/order.item.entity';
import { OrderWorkflowRepository } from '../infrastructure/order-workflow.repository';
import { assertDraft } from './order-guards';

// as a business owner, I want to change the quantity or cost of a draft order line
@Injectable()
export class OrderItemUpdateUsecase {
  constructor(private readonly workflow: OrderWorkflowRepository) {}

  async execute(
    id: string,
    businessId: string,
    orderData: UpdateOrderItemDto,
    scope: BranchScope,
  ) {
    const data = new OrderItemUpdateEntity(orderData);

    return this.workflow.transaction(async (tx) => {
      const order = await this.workflow.lockOrderOfItem(
        tx,
        businessId,
        id,
        scope,
      );
      if (!order) throw new NotFoundException('Order item not found');
      assertDraft(order);

      const item = await this.workflow.updateItem(tx, id, {
        ...(data.qty !== undefined && { qty: data.qty }),
        ...(data.price !== undefined && { price: data.price }),
      });
      await this.workflow.recomputeTotal(tx, order.id);
      return item;
    });
  }
}
