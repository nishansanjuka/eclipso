import { Injectable } from '@nestjs/common';
import { SaleRepository } from './sale.repository';
import { PaymentService } from '../../payment/infrastructure/payment.service';

@Injectable()
export class SaleService {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly paymentService: PaymentService,
  ) {}

  async getSaleById(id: string, businessId: string) {
    const [sale] = await this.saleRepository.getSaleById(id, businessId);
    if (!sale) return null;

    const items = await this.saleRepository.getSaleItemsBySaleId(sale.id);
    const payment = await this.paymentService.getPaymentBySaleId(sale.id);

    return {
      ...sale,
      items,
      payment,
    };
  }

  async getSaleItemsBySaleId(saleId: string) {
    return await this.saleRepository.getSaleItemsBySaleId(saleId);
  }
}
