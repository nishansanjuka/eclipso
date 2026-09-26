import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderItemDiscountDto } from '../dto/order-item.discount';
import { OrderItemDiscountEntity } from '../domain/orer.item.discount.entity';
import { OrderWorkflowRepository } from '../infrastructure/order-workflow.repository';
import { assertDraft } from './order-guards';

// as a business owner, I want to add or remove discount records associated with a draft order item,
// so that I can provide special offers or price reductions for specific items in an order.
@Injectable()
export class OrderItemDiscountsUpdateUsecase {
  constructor(private readonly workflow: OrderWorkflowRepository) {}

  async add(orderDiscountData: OrderItemDiscountDto, businessId: string) {
    const data = new OrderItemDiscountEntity(orderDiscountData);

    return this.workflow.transaction(async (tx) => {
      const order = await this.workflow.lockOrderOfItem(
        tx,
        businessId,
        data.orderItemId,
      );
      if (!order) throw new NotFoundException('Order item not found');
      assertDraft(order);
      if (
        !(await this.workflow.discountInBusiness(
          tx,
          businessId,
          data.discountId,
        ))
      ) {
        throw new NotFoundException('Discount not found');
      }

      await this.workflow.addItemDiscount(
        tx,
        data.orderItemId,
        data.discountId,
      );
      return { orderItemId: data.orderItemId, discountId: data.discountId };
    });
  }

  async remove(orderDiscountData: OrderItemDiscountDto, businessId: string) {
    const data = new OrderItemDiscountEntity(orderDiscountData);

    return this.workflow.transaction(async (tx) => {
      const order = await this.workflow.lockOrderOfItem(
        tx,
        businessId,
        data.orderItemId,
      );
      if (!order) throw new NotFoundException('Order item not found');
      assertDraft(order);

      await this.workflow.removeItemDiscount(
        tx,
        data.orderItemId,
        data.discountId,
      );
      return { orderItemId: data.orderItemId, discountId: data.discountId };
    });
  }
}
