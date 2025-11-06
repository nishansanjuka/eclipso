import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { TaxService } from '../infrastructure/tax.service';
import { NotFoundException } from '@nestjs/common';
import { BusinessService } from '../../business/infrastructure/business.service';

@Injectable()
export class TaxDeleteUsecase {
  constructor(
    private readonly taxService: TaxService,
    private readonly businessService: BusinessService,
  ) {}

  // as a user I can delete a tax record
  async execute(orgId: string, taxId: string) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id: businessId } = res;
      return this.taxService.deleteTax(taxId, businessId);
    }
  }
}
