import { Injectable } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { CreatePaymentDto } from '../dto/payment.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async createPayment(paymentData: CreatePaymentDto & { saleId: string }) {
    return await this.paymentRepository.createPayment(paymentData);
  }

  async updatePayment(id: string, paymentData: Partial<CreatePaymentDto>) {
    return await this.paymentRepository.updatePayment(id, paymentData);
  }

  async deletePayment(id: string) {
    return await this.paymentRepository.deletePayment(id);
  }

  async getPaymentById(id: string) {
    return await this.paymentRepository.getPaymentById(id);
  }

  async getPaymentBySaleId(saleId: string) {
    return await this.paymentRepository.getPaymentBySaleId(saleId);
  }
}
