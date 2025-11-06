import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryService } from '../infrastructure/category.service';
import { BusinessService } from '../../business/infrastructure/business.service';
import { CategoryUpdateEntity } from '../domain/category.entity';
import { UpdateCategoryDto } from '../dto/category.dto';

@Injectable()
export class CategoryUpdateUseCase {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly businessService: BusinessService,
  ) {}

  // as business owner, update product category
  async execute(id: string, orgId: string, categoryData: UpdateCategoryDto) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id: businessId } = res;
      const data = new CategoryUpdateEntity({
        ...categoryData,
        businessId,
      });
      return this.categoryService.updateCategory(id, data.businessId, data);
    }
  }
}
