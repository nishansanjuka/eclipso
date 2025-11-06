import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { BusinessService } from '../business/infrastructure/business.service';
import { BusinessRepository } from '../business/infrastructure/business.repository';
import { DiscountService } from './infrastructure/discount.service';
import { DiscountRepository } from './infrastructure/discount.repository';
import { DiscountCreateUsecase } from './application/discount-create.usecase';
import { DiscountUpdateUsecase } from './application/discount-update.usecase';
import { DiscountDeleteUsecase } from './application/discount-delete.usecase';
import { DiscountController } from './presentation/tax.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [DiscountController],
  providers: [
    BusinessService,
    BusinessRepository,
    DiscountService,
    DiscountRepository,
    DiscountCreateUsecase,
    DiscountUpdateUsecase,
    DiscountDeleteUsecase,
  ],
})
export class DiscountModule {}
