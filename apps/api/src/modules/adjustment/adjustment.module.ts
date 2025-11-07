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
  ],
  exports: [AdjustmentService, AdjustmentCreateUsecase],
})
export class AdjustmentModule {}
