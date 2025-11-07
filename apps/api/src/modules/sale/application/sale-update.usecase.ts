import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSaleDto } from '../dto/sale.dto';
import { SaleService } from '../infrastructure/sale.service';
import { BusinessService } from '../../business/infrastructure/business.service';
import { SaleUpdateEntity } from '../domain/sale.entity';

@Injectable()
export class SaleUpdateUseCase {
  constructor(
    private readonly saleService: SaleService,
    private readonly businessService: BusinessService,
  ) {}

  async execute(
    id: string,
    orgId: string,
    saleData: Partial<Omit<CreateSaleDto, 'businessId' | 'items'>>,
  ) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id: businessId } = res;
      const data = new SaleUpdateEntity({
        ...saleData,
        businessId,
      });
      return this.saleService.updateSale(id, businessId, data);
    }
  }
}
