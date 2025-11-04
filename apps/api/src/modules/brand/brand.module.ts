import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { BusinessService } from '../business/infrastructure/business.service';
import { BusinessRepository } from '../business/infrastructure/business.repository';
import { BrandController } from './presentation/brand.controller';
import { BrandService } from './infrastructure/brand.service';
import { BrandRepository } from './infrastructure/brand.repository';
import { BrandCreateUsecase } from './application/brand-create.usecase';
import { BrandUpdateUsecase } from './application/brand-update.usecase';
import { BrandDeleteUsecase } from './application/brand-delete.usecase';

@Module({
  imports: [DatabaseModule],
  controllers: [BrandController],
  providers: [
    BusinessService,
    BusinessRepository,
    BrandService,
    BrandRepository,
    BrandCreateUsecase,
    BrandUpdateUsecase,
    BrandDeleteUsecase,
  ],
})
export class BrandModule {}
