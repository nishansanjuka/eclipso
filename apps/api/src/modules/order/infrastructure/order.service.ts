import { Injectable } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CreateOrderDto, UpdateOrderDto } from '../dto/order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async createOrder(orderData: CreateOrderDto) {
    return await this.orderRepository.createOrder(orderData);
  }

  async updateOrder(orderId: string, orderData: UpdateOrderDto) {
    return await this.orderRepository.updateOrderById(orderId, orderData);
  }

  async deleteOrder(orderId: string, businessId: string) {
    return await this.orderRepository.deleteOrderById(orderId, businessId);
  }

  async getOrder(orderId: string, orgId: string) {
    return await this.orderRepository.getOrderById(orderId, orgId);
  }

  async getOrderByInvoiceId(invoiceId: string, orgId: string) {
    return await this.orderRepository.getOrderByInvoiceId(invoiceId, orgId);
  }
}
