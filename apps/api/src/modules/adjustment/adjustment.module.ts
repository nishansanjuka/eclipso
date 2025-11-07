import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { AdjustmentRepository } from './infrastructure/adjustment.repository';
import { AdjustmentService } from './infrastructure/adjustment.service';
import { AdjustmentCreateUsecase } from './application/adjustment.create.usecase';
import { BusinessService } from '../business/infrastructure/business.service';
import { BusinessRepository } from '../business/infrastructure/business.repository';
import { InventoryMovementService } from '../inventory/infrastructure/inventory.movements.service';
import { InventoryMovementsRepository } from '../inventory/infrastructure/inventory.movements.repository';
import { AdjustmentController } from './presentation/adjustment.controller';
import { ProductService } from '../product/infrastructure/product.service';
import { UserService } from '../users/infrastructure/user.service';
import { UserRepository } from '../users/infrastructure/user.repository';
import { ProductRepository } from '../product/infrastructure/product.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [AdjustmentController],
  providers: [
    AdjustmentRepository,
    AdjustmentService,
    AdjustmentCreateUsecase,
    BusinessService,
    BusinessRepository,
    InventoryMovementService,
    InventoryMovementsRepository,
    ProductService,
    UserRepository,
    ProductRepository,
    UserService,
  ],
  exports: [AdjustmentService, AdjustmentCreateUsecase],
})
export class AdjustmentModule {}
