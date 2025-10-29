import { Injectable } from '@nestjs/common';
import { OrderItemRepository } from './order-item.repository';
import { OrderItemCreateDto } from '../dto/order-item.dto';

@Injectable()
export class OrderItemService {
  constructor(private readonly orderItemRepository: OrderItemRepository) {}

  async createOrderItem(orderItemData: OrderItemCreateDto) {
    return await this.orderItemRepository.createOrderItem(orderItemData);
  }

  async updateOrderItem(
    orderItemId: string,
    orderItemData: OrderItemCreateDto,
  ) {
    return await this.orderItemRepository.updateOrderItemById(
      orderItemId,
      orderItemData,
    );
  }

  async deleteOrderItem(orderItemId: string) {
    return await this.orderItemRepository.deleteOrderItemById(orderItemId);
  }
}
