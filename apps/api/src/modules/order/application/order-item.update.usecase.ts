import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { OrderItemService } from '../infrastructure/order-item.service';
import { OrderItemUpdateEntity } from '../domain/order.item.entity';
import { UpdateOrderItemDto } from '../dto/order-item.dto';
import { NotFoundException } from '@nestjs/common';

// as an business owner, I want to update existing order item
@Injectable()
export class OrderItemUpdateUsecase {
  constructor(private readonly orderItemService: OrderItemService) {}

  async execute(id: string, orgId: string, orderData: UpdateOrderItemDto) {
    const res = await this.orderItemService.validateOrderItemOwnership(
      id,
      orgId,
    );

    if (!res) {
      throw new NotFoundException(
        'Order item not found for the authorized organization',
      );
    }

    const orderItem = new OrderItemUpdateEntity(orderData);
    return await this.orderItemService.updateOrderItem(id, orderItem);
  }
}
