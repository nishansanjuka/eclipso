import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryService } from '../infrastructure/category.service';
import { CreateCategoryDto } from '../dto/category.dto';
import { BusinessService } from '../../business/infrastructure/business.service';
import { CategoryCreateEntity } from '../domain/category.entity';

@Injectable()
export class CategoryCreateUseCase {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly businessService: BusinessService,
  ) {}

  // as business owner, create product category
  async execute(orgId: string, categoryData: CreateCategoryDto) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id } = res;
      const data = new CategoryCreateEntity({
        ...categoryData,
        businessId: id,
      });
      return this.categoryService.createCategory(data);
    }
  }
}
