import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { CategoriesController } from './presentation/category.controller';
import { CategoryRepository } from './infrastructure/category.repository';
import { CategoryService } from './infrastructure/category.service';
import { CategoryCreateUseCase } from './application/category-create.usecase';
import { CategoryUpdateUseCase } from './application/update-category.usecase';
import { CategoryDeleteUseCase } from './application/category-delete.usecase';
import { BusinessService } from '../business/infrastructure/business.service';
import { BusinessRepository } from '../business/infrastructure/business.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [CategoriesController],
  providers: [
    CategoryService,
    BusinessService,
    CategoryRepository,
    BusinessRepository,
    CategoryCreateUseCase,
    CategoryUpdateUseCase,
    CategoryDeleteUseCase,
  ],
})
export class CategoriesModule {}
