import { Injectable } from '@nestjs/common';
import { OrderRepository } from './order.repository';

@Injectable()
export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async getOrder(orderId: string, orgId: string) {
    return await this.orderRepository.getOrderById(orderId, orgId);
  }

  async getOrderByInvoiceId(invoiceId: string, orgId: string) {
    return await this.orderRepository.getOrderByInvoiceId(invoiceId, orgId);
  }
}
