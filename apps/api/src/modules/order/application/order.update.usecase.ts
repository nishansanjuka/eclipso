import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateOrderDto } from '../dto/order.dto';
import { OrderUpdateEntity } from '../domain/order.entity';
import { OrderWorkflowRepository } from '../infrastructure/order-workflow.repository';
import { assertDraft } from './order-guards';

// as a business owner, I want to reschedule or cancel a draft order
@Injectable()
export class OrderUpdateUsecase {
  constructor(private readonly workflow: OrderWorkflowRepository) {}

  async execute(id: string, businessId: string, orderData: UpdateOrderDto) {
    const data = new OrderUpdateEntity(orderData);

    return this.workflow.transaction(async (tx) => {
      const order = await this.workflow.lockOrder(tx, businessId, id);
      if (!order) throw new NotFoundException('Order not found');
      assertDraft(order);

      return this.workflow.updateOrder(tx, order.id, {
        ...(data.expectedDate && { expectedDate: data.expectedDate }),
        ...(data.status && { status: data.status }),
      });
    });
  }
}
