import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { NotFoundException } from '@nestjs/common';
import { BusinessService } from '../../business/infrastructure/business.service';
import { DiscountService } from '../infrastructure/discount.service';
import { UpdateDiscountDto } from '../dto/discount.dto';
import { DiscountUpdateEntity } from '../domain/discount.entity';

@Injectable()
export class DiscountUpdateUsecase {
  constructor(
    private readonly discountService: DiscountService,
    private readonly businessService: BusinessService,
  ) {}

  // as a user I can update a discount record
  async execute(
    orgId: string,
    discountId: string,
    discountData: UpdateDiscountDto,
  ) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id } = res;
      const data = new DiscountUpdateEntity({
        ...discountData,
        businessId: id,
      });
      return this.discountService.updateDiscount(discountId, data);
    }
  }
}
