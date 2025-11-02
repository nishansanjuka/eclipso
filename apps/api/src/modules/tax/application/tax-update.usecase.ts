import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { UpdateTaxDto } from '../dto/tax.dto';
import { TaxService } from '../infrastructure/tax.service';
import { NotFoundException } from '@nestjs/common';
import { BusinessService } from '../../business/infrastructure/business.service';
import { TaxUpdateEntity } from '../domain/tax.entity';

@Injectable()
export class TaxUpdateUsecase {
  constructor(
    private readonly taxService: TaxService,
    private readonly businessService: BusinessService,
  ) {}

  // as a user I can update a tax record
  async execute(orgId: string, taxId: string, taxData: UpdateTaxDto) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id } = res;
      const data = new TaxUpdateEntity({
        ...taxData,
        businessId: id,
      });
      return this.taxService.updateTax(taxId, data);
    }
  }
}
