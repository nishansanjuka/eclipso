import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { BrandService } from '../infrastructure/brand.service';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { BusinessService } from '../../business/infrastructure/business.service';

@Injectable()
export class BrandDeleteUsecase {
  constructor(
    private readonly brandService: BrandService,
    private readonly businessService: BusinessService,
  ) {}

  // as a user I can delete a brand
  async execute(orgId: string, brandId: string) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id: businessId } = res;

      return this.brandService.deleteBrand(brandId, businessId);
    }
  }
}
