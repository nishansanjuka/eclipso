import { Injectable } from '@nestjs/common';
import { OrderItemRepository } from './order-item.repository';
import { CreateOrderItemDto, UpdateOrderItemDto } from '../dto/order-item.dto';

@Injectable()
export class OrderItemService {
  constructor(private readonly orderItemRepository: OrderItemRepository) {}

  async createOrderItem(orderItemData: CreateOrderItemDto) {
    return await this.orderItemRepository.createOrderItem(orderItemData);
  }

  async updateOrderItem(
    orderItemId: string,
    orderItemData: UpdateOrderItemDto,
  ) {
    return await this.orderItemRepository.updateOrderItemById(
      orderItemId,
      orderItemData,
    );
  }

  async deleteOrderItem(orderItemId: string) {
    return await this.orderItemRepository.deleteOrderItemById(orderItemId);
  }

  async validateOrderItemOwnership(
    orderItemId: string,
    orgId: string,
  ): Promise<boolean> {
    return await this.orderItemRepository.validateOrderItemOwnership(
      orderItemId,
      orgId,
    );
  }

  async addTaxRecordsToOrderItem(orderItemId: string, taxIds: string[]) {
    return await this.orderItemRepository.addTaxRecordsToOrderItem(
      orderItemId,
      taxIds,
    );
  }

  async removeTaxRecordsFromOrderItem(orderItemId: string, taxIds?: string[]) {
    return await this.orderItemRepository.removeTaxRecordsFromOrderItem(
      orderItemId,
      taxIds,
    );
  }

  async getTaxRecordsForOrderItem(orderItemId: string) {
    return await this.orderItemRepository.getTaxRecordsForOrderItem(
      orderItemId,
    );
  }

  async addDiscountRecordsToOrderItem(
    orderItemId: string,
    discountIds: string[],
  ) {
    return await this.orderItemRepository.addDiscountRecordsToOrderItem(
      orderItemId,
      discountIds,
    );
  }

  async removeDiscountRecordsFromOrderItem(
    orderItemId: string,
    discountIds?: string[],
  ) {
    return await this.orderItemRepository.removeDiscountRecordsFromOrderItem(
      orderItemId,
      discountIds,
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

  async getOrderItemsById(id: string) {
    return await this.orderItemRepository.getOrderItemsById(id);
  }
}
