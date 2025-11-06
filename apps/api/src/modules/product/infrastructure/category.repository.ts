import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { categories } from './schema/category.schema';
import { type DrizzleClient } from '../../../shared/database/drizzle.module';

@Injectable()
export class CategoryRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createCategory(categoryData: CreateCategoryDto) {
    return await this.db.insert(categories).values(categoryData).returning();
  }

  async updateCategoryWithBusinessId(
    id: string,
    businessId: string,
    categoryData: UpdateCategoryDto,
  ) {
    return await this.db
      .update(categories)
      .set(categoryData)
      .where(and(eq(categories.id, id), eq(categories.businessId, businessId)));
  }

  async deleteCategoryWithBusinessId(id: string, businessId: string) {
    return await this.db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.businessId, businessId)));
  }
}
