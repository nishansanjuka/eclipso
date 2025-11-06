import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryService } from '../infrastructure/category.service';
import { BusinessService } from '../../business/infrastructure/business.service';

@Injectable()
export class CategoryDeleteUseCase {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly businessService: BusinessService,
  ) {}

  // as business owner, delete product category
  async execute(id: string, orgId: string) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id: businessId } = res;
      return this.categoryService.deleteCategory(id, businessId);
    }
  }
}
