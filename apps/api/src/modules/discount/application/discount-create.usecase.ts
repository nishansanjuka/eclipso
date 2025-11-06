import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { NotFoundException } from '@nestjs/common';
import { BusinessService } from '../../business/infrastructure/business.service';
import { DiscountService } from '../infrastructure/discount.service';
import { CreateDiscountDto } from '../dto/discount.dto';
import { DiscountCreateEntity } from '../domain/discount.entity';

@Injectable()
export class DiscountCreateUsecase {
  constructor(
    private readonly discountService: DiscountService,
    private readonly businessService: BusinessService,
  ) {}

  // as a user I can create a discount record
  async execute(orgId: string, discountData: CreateDiscountDto) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id } = res;
      const data = new DiscountCreateEntity({
        ...discountData,
        businessId: id,
      });
      return this.discountService.createDiscount(data);
    }
  }
}
