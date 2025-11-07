import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { ReturnController } from './presentation/return.controller';
import { ReturnService } from './infrastructure/return.service';
import { ReturnRepository } from './infrastructure/return.repository';
import { ReturnCreateUseCase } from './application/return-create.usecase';
import { BusinessService } from '../business/infrastructure/business.service';
import { BusinessRepository } from '../business/infrastructure/business.repository';
import { SaleService } from '../sale/infrastructure/sale.service';
import { SaleRepository } from '../sale/infrastructure/sale.repository';
import { ProductService } from '../product/infrastructure/product.service';
import { ProductRepository } from '../product/infrastructure/product.repository';
import { InventoryMovementService } from '../inventory/infrastructure/inventory.movements.service';
import { InventoryMovementsRepository } from '../inventory/infrastructure/inventory.movements.repository';
import { PaymentService } from '../payment/infrastructure/payment.service';
import { PaymentRepository } from '../payment/infrastructure/payment.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [ReturnController],
  providers: [
    ReturnService,
    ReturnRepository,
    ReturnCreateUseCase,
    BusinessService,
    BusinessRepository,
    SaleService,
    SaleRepository,
    ProductService,
    ProductRepository,
    InventoryMovementService,
    InventoryMovementsRepository,
    PaymentService,
    PaymentRepository,
  ],
  exports: [ReturnService, ReturnRepository],
})
export class ReturnModule {}
