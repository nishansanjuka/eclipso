import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { OrderItemService } from '../infrastructure/order-item.service';
import { NotFoundException } from '@nestjs/common';
import { OrderItemDiscountEntity } from '../domain/orer.item.discount.entity';
import { OrderItemDiscountDto } from '../dto/order-item.discount';

// as an business owner, I want to be able to add or remove discount records associated with an order item,
// so that I can provide special offers or price reductions for specific items in an order.
@Injectable()
export class OrderItemDiscountsUpdateUsecase {
  constructor(private readonly orderItemService: OrderItemService) {}

  async add(orderDiscountData: OrderItemDiscountDto, orgId: string) {
    const res = await this.orderItemService.validateOrderItemOwnership(
      orderDiscountData.orderItemId,
      orgId,
    );

    if (!res) {
      throw new NotFoundException(
        'Order item not found for the authorized organization',
      );
    }

    const orderItem = new OrderItemDiscountEntity(orderDiscountData);
    return await this.orderItemService.addDiscountRecordsToOrderItem(
      orderItem.orderItemId,
      [orderItem.discountId],
    );
  }

  async remove(orderDiscountData: OrderItemDiscountDto, orgId: string) {
    const res = await this.orderItemService.validateOrderItemOwnership(
      orderDiscountData.orderItemId,
      orgId,
    );

    if (!res) {
      throw new NotFoundException(
        'Order item not found for the authorized organization',
      );
    }

    const orderItem = new OrderItemDiscountEntity(orderDiscountData);
    return await this.orderItemService.removeDiscountRecordsFromOrderItem(
      orderItem.orderItemId,
      [orderItem.discountId],
    );
  }
}
