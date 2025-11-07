import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { CustomerController } from './presentation/customer.controller';
import { BusinessService } from '../business/infrastructure/business.service';
import { BusinessRepository } from '../business/infrastructure/business.repository';
import { CustomerCreateUseCase } from './application/customer-create.usecase';
import { CustomerService } from './infrastructure/customer.service';
import { CustomerRepository } from './infrastructure/customer.repository';
import { CustomerUpdateUseCase } from './application/customer-update.usecase';
import { CustomerDeleteUseCase } from './application/customer-delete.usecase';

@Module({
  imports: [DatabaseModule],
  controllers: [CustomerController],
  providers: [
    BusinessService,
    CustomerService,
    BusinessRepository,
    CustomerRepository,
    CustomerCreateUseCase,
    CustomerUpdateUseCase,
    CustomerDeleteUseCase,
  ],
})
export class CustomerModule {}
