import { Injectable } from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { CategoryCreateDto, CategoryUpdateDto } from '../dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async createCategory(categoryData: CategoryCreateDto) {
    return await this.categoryRepository.createCategory(categoryData);
  }

  async updateCategory(
    id: string,
    businessId: string,
    categoryData: CategoryUpdateDto,
  ) {
    return await this.categoryRepository.updateCategoryWithBusinessId(
      id,
      businessId,
      categoryData,
    );
  }

  async deleteCategory(id: string, businessId: string) {
    return await this.categoryRepository.deleteCategoryWithBusinessId(
      id,
      businessId,
    );
  }
}
