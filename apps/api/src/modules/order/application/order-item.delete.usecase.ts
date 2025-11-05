import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { OrderItemService } from '../infrastructure/order-item.service';
import { NotFoundException } from '@nestjs/common';

// as an business owner, I want to delete existing order item
@Injectable()
export class OrderItemDeleteUsecase {
  constructor(private readonly orderItemService: OrderItemService) {}

  async execute(id: string, orgId: string) {
    const res = await this.orderItemService.validateOrderItemOwnership(
      id,
      orgId,
    );

    if (!res) {
      throw new NotFoundException(
        'Order item not found for the authorized organization',
      );
    }

    return await this.orderItemService.deleteOrderItem(id);
  }
}
