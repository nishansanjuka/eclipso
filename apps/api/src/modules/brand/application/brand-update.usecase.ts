import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { BrandService } from '../infrastructure/brand.service';
import { UpdateBrandDto } from '../dto/brand';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { BusinessService } from '../../business/infrastructure/business.service';
import { BrandUpdateEntity } from '../domain/brand.entity';

@Injectable()
export class BrandUpdateUsecase {
  constructor(
    private readonly brandService: BrandService,
    private readonly businessService: BusinessService,
  ) {}

  // as a user I can update a brand
  async execute(orgId: string, brandId: string, brandData: UpdateBrandDto) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id: businessId } = res;

      const data = new BrandUpdateEntity({
        ...brandData,
      });
      return this.brandService.updateBrand(brandId, businessId, data);
    }
  }
}
