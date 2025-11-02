import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { NotFoundException } from '@nestjs/common';
import { BusinessService } from '../../business/infrastructure/business.service';
import { DiscountService } from '../infrastructure/discount.service';

@Injectable()
export class DiscountDeleteUsecase {
  constructor(
    private readonly discountService: DiscountService,
    private readonly businessService: BusinessService,
  ) {}

  // as a user I can delete a discount record
  async execute(orgId: string, discountId: string) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id: businessId } = res;
      return this.discountService.deleteDiscount(discountId, businessId);
    }
  }
}
