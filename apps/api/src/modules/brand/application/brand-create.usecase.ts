import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { BrandService } from '../infrastructure/brand.service';
import { CreateBrandDto } from '../dto/brand';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { BusinessService } from '../../business/infrastructure/business.service';
import { BrandCreateEntity } from '../domain/brand.entity';

@Injectable()
export class BrandCreateUsecase {
  constructor(
    private readonly brandService: BrandService,
    private readonly businessService: BusinessService,
  ) {}

  // as a user I can create a brand
  async execute(orgId: string, brandData: CreateBrandDto) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id } = res;

      const data = new BrandCreateEntity({
        ...brandData,
        businessId: id,
      });
      return this.brandService.createBrand(data);
    }
  }
}
