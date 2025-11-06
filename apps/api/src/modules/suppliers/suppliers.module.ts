import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { SupplierController } from './presentation/supplier.controller';
import { BusinessService } from '../business/infrastructure/business.service';
import { BusinessRepository } from '../business/infrastructure/business.repository';
import { SupplierCreateUseCase } from './application/supplier-create.usecase';
import { SupplierService } from './infrastructure/supplier.service';
import { SupplierRepository } from './infrastructure/supplier.repository';
import { SupplierUpdateUseCase } from './application/supplier-update.usecase';
import { SupplierDeleteUseCase } from './application/supplier-delete.usecase';

@Module({
  imports: [DatabaseModule],
  controllers: [SupplierController],
  providers: [
    BusinessService,
    SupplierService,
    BusinessRepository,
    SupplierRepository,
    SupplierCreateUseCase,
    SupplierUpdateUseCase,
    SupplierDeleteUseCase,
  ],
})
export class SuppliersModule {}
