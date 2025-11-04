import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { BusinessService } from '../business/infrastructure/business.service';
import { BusinessRepository } from '../business/infrastructure/business.repository';
import { OrderController } from './presentation/order.controller';
import { OrderCreateUsecase } from './application/order.create.usecase';
import { OrderUpdateUsecase } from './application/order.update.usecase';
import { OrderDeleteUsecase } from './application/order.delete.usecase';
import { OrderService } from './infrastructure/order.service';
import { OrderRepository } from './infrastructure/order.repository';
import { InvoiceService } from '../invoice/infrastructure/invoice.service';
import { InvoiceRepository } from '../invoice/infrastructure/invoice.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [OrderController],
  providers: [
    OrderService,
    InvoiceService,
    OrderRepository,
    BusinessService,
    InvoiceRepository,
    BusinessRepository,
    OrderCreateUsecase,
    OrderUpdateUsecase,
    OrderDeleteUsecase,
  ],
})
export class OrderModule {}
