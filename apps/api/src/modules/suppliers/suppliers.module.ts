import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { SupplierController } from './presentation/supplier.controller';
import { BusinessService } from '../business/infrastructure/business.service';
import { BusinessRepository } from '../business/infrastructure/business.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [SupplierController],
  providers: [BusinessRepository, BusinessService],
})
export class SuppliersModule {}
