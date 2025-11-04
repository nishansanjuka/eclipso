import { Injectable } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { OrderCreateDto, OrderUpdateDto } from '../dto/order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async createOrder(orderData: OrderCreateDto) {
    return await this.orderRepository.createOrder(orderData);
  }

  async updateOrder(orderId: string, orderData: OrderUpdateDto) {
    return await this.orderRepository.updateOrderById(orderId, orderData);
  }

  async deleteOrder(orderId: string, businessId: string) {
    return await this.orderRepository.deleteOrderById(orderId, businessId);
  }

  async getOrder(orderId: string, businessId: string) {
    return await this.orderRepository.getOrderById(orderId, businessId);
  }
}
