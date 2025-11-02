import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { CreateTaxDto } from '../dto/tax.dto';
import { TaxService } from '../infrastructure/tax.service';
import { NotFoundException } from '@nestjs/common';
import { BusinessService } from '../../business/infrastructure/business.service';
import { TaxCreateEntity } from '../domain/tax.entity';

@Injectable()
export class TaxCreateUsecase {
  constructor(
    private readonly taxService: TaxService,
    private readonly businessService: BusinessService,
  ) {}

  // as a user I can create a tax record
  async execute(orgId: string, taxData: CreateTaxDto) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id } = res;
      const data = new TaxCreateEntity({
        ...taxData,
        businessId: id,
      });
      return this.taxService.createTax(data);
    }
  }
}
