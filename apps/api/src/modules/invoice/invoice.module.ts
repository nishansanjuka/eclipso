import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { InvoicesController } from './presentation/invoice.controller';
import { InvoiceService } from './infrastructure/invoice.service';
import { InvoiceRepository } from './infrastructure/invoice.repository';
import { InvoiceCalculateUsecase } from './application/invoice-calculate.usecase';
import { OrderItemService } from '../order/infrastructure/order-item.service';
import { TaxService } from '../tax/infrastructure/tax.service';
import { DiscountService } from '../discount/infrastructure/discount.service';
import { OrderService } from '../order/infrastructure/order.service';
import { OrderItemRepository } from '../order/infrastructure/order-item.repository';
import { OrderRepository } from '../order/infrastructure/order.repository';
import { TaxRepository } from '../tax/infrastructure/tax.repository';
import { DiscountRepository } from '../discount/infrastructure/discount.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [InvoicesController],
  providers: [
    InvoiceService,
    InvoiceRepository,
    InvoiceCalculateUsecase,
    OrderItemService,
    OrderItemRepository,
    OrderService,
    OrderRepository,
    TaxService,
    TaxRepository,
    DiscountService,
    DiscountRepository,
  ],
})
export class InvoiceModule {}
