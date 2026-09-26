import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateSaleDto } from '../dto/sale.dto';
import { SaleService } from '../infrastructure/sale.service';
import { SaleCheckoutRepository } from '../infrastructure/sale-checkout.repository';
import { SaleUpdateEntity } from '../domain/sale.entity';

/**
 * Only the customer attached to a sale can be changed after the fact. Totals,
 * lines and payments are immutable: corrections go through returns/voids so
 * stock and money always reconcile.
 */
@Injectable()
export class SaleUpdateUseCase {
  constructor(
    private readonly saleService: SaleService,
    private readonly checkout: SaleCheckoutRepository,
  ) {}

  async execute(id: string, businessId: string, saleData: UpdateSaleDto) {
    const data = new SaleUpdateEntity(saleData);

    if (data.customerId) {
      const customerId = data.customerId;
      const exists = await this.checkout.transaction((tx) =>
        this.checkout.customerExists(tx, businessId, customerId),
      );
      if (!exists) {
        throw new NotFoundException(`Customer with ID ${customerId} not found`);
      }
    }

    const [updated] = await this.saleService.updateSale(id, businessId, {
      customerId: data.customerId,
    });
    if (!updated) throw new NotFoundException('Sale not found');
    return updated;
  }
}
