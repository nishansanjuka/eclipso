import { Injectable } from '@nestjs/common';
import { OrderItemRepository } from './order-item.repository';

/** Read side (used by invoice calculation). Writes go through the order use cases. */
@Injectable()
export class OrderItemService {
  constructor(private readonly orderItemRepository: OrderItemRepository) {}

  async getTaxRecordsForOrderItem(orderItemId: string) {
    return await this.orderItemRepository.getTaxRecordsForOrderItem(
      orderItemId,
    );
  }

  async getDiscountRecordsForOrderItem(orderItemId: string) {
    return await this.orderItemRepository.getDiscountRecordsForOrderItem(
      orderItemId,
    );
  }

  async getOrderItemsByOrderId(orderId: string) {
    return await this.orderItemRepository.getOrderItemsByOrderId(orderId);
  }
}
