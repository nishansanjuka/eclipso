import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { TaxController } from './presentation/tax.controller';
import { TaxRepository } from './infrastructure/tax.repository';
import { TaxCreateUsecase } from './application/tax-create.usecase';
import { TaxUpdateUsecase } from './application/tax-update.usecase';
import { TaxDeleteUsecase } from './application/tax-delete.usecase';
import { TaxService } from './infrastructure/tax.service';
import { BusinessService } from '../business/infrastructure/business.service';
import { BusinessRepository } from '../business/infrastructure/business.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [TaxController],
  providers: [
    TaxService,
    TaxRepository,
    BusinessService,
    TaxCreateUsecase,
    TaxUpdateUsecase,
    TaxDeleteUsecase,
    BusinessRepository,
  ],
})
export class TaxModule {}
