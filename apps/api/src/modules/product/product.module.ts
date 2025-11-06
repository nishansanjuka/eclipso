import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { ProductsController } from './presentation/produt.controller';
import { ProductService } from './infrastructure/product.service';
import { ProductRepository } from './infrastructure/product.repository';
import { ProductCreateUseCase } from './application/product-create.usecase';
import { ProductDeleteUseCase } from './application/product-delete.usecase';
import { ProductUpdateUseCase } from './application/product-update.usecase';
import { BusinessService } from '../business/infrastructure/business.service';
import { BusinessRepository } from '../business/infrastructure/business.repository';
import { CategoriesModule } from './product.category.module';

@Module({
  imports: [DatabaseModule, CategoriesModule],
  controllers: [ProductsController],
  providers: [
    ProductService,
    ProductRepository,
    ProductCreateUseCase,
    ProductDeleteUseCase,
    ProductUpdateUseCase,
    BusinessService,
    BusinessRepository,
  ],
})
export class ProductModule {}
