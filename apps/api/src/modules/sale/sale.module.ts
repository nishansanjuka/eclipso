import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { SaleController } from './presentation/sale.controller';
import { SaleService } from './infrastructure/sale.service';
import { SaleRepository } from './infrastructure/sale.repository';
import { SaleCreateUseCase } from './application/sale-create.usecase';
import { SaleUpdateUseCase } from './application/sale-update.usecase';
import { SaleDeleteUseCase } from './application/sale-delete.usecase';
import { SaleGetUseCase } from './application/sale-get.usecase';
import { BusinessService } from '../business/infrastructure/business.service';
import { BusinessRepository } from '../business/infrastructure/business.repository';
import { ProductService } from '../product/infrastructure/product.service';
import { ProductRepository } from '../product/infrastructure/product.repository';
import { InventoryMovementService } from '../inventory/infrastructure/inventory.movements.service';
import { InventoryMovementsRepository } from '../inventory/infrastructure/inventory.movements.repository';
import { PaymentService } from '../payment/infrastructure/payment.service';
import { PaymentRepository } from '../payment/infrastructure/payment.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [SaleController],
  providers: [
    SaleService,
    SaleRepository,
    SaleCreateUseCase,
    SaleUpdateUseCase,
    SaleDeleteUseCase,
    SaleGetUseCase,
    BusinessService,
    BusinessRepository,
    ProductService,
    ProductRepository,
    InventoryMovementService,
    InventoryMovementsRepository,
    PaymentService,
    PaymentRepository,
  ],
  exports: [SaleService, SaleRepository],
})
export class SaleModule {}
