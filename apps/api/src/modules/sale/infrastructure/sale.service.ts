import { Injectable } from '@nestjs/common';
import { SaleRepository } from './sale.repository';
import { CreateSaleDto, CreateSaleItemDto } from '../dto/sale.dto';
import { PaymentService } from '../../payment/infrastructure/payment.service';

@Injectable()
export class SaleService {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly paymentService: PaymentService,
  ) {}

  async createSale(saleData: Omit<CreateSaleDto, 'items'>) {
    return await this.saleRepository.createSale(saleData);
  }

  async createSaleItem(saleItemData: CreateSaleItemDto & { saleId: string }) {
    return await this.saleRepository.createSaleItem(saleItemData);
  }

  async createSaleItems(
    saleItemsData: (CreateSaleItemDto & { saleId: string })[],
  ) {
    return await this.saleRepository.createSaleItems(saleItemsData);
  }

  async createSaleWithItems(saleData: CreateSaleDto) {
    const [sale] = await this.saleRepository.createSale({
      businessId: saleData.businessId,
      customerId: saleData.customerId,
      totalAmount: saleData.totalAmount,
      qty: saleData.qty,
    });

    const itemsWithSaleId = saleData.items.map((item) => ({
      ...item,
      saleId: sale.id,
    }));

    const items = await this.saleRepository.createSaleItems(itemsWithSaleId);

    return {
      ...sale,
      items,
    };
  }

  async updateSale(
    id: string,
    businessId: string,
    saleData: Partial<Omit<CreateSaleDto, 'items'>>,
  ) {
    return await this.saleRepository.updateSaleWithBusinessId(
      id,
      businessId,
      saleData,
    );
  }

  async updateSaleItem(id: string, saleItemData: Partial<CreateSaleItemDto>) {
    return await this.saleRepository.updateSaleItem(id, saleItemData);
  }

  async deleteSale(id: string, businessId: string) {
    await this.saleRepository.deleteSaleItemsBySaleId(id);
    return await this.saleRepository.deleteSaleWithBusinessId(id, businessId);
  }

  async deleteSaleItem(id: string) {
    return await this.saleRepository.deleteSaleItem(id);
  }

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
