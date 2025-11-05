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
import { OrderItemRepository } from './infrastructure/order-item.repository';
import { OrderItemService } from './infrastructure/order-item.service';
import { OrderItemCreateUsecase } from './application/order-item.create.usecase';
import { OrderItemUpdateUsecase } from './application/order-item.update.usecase';
import { OrderItemDeleteUsecase } from './application/order-item.delete.usecase';
import { ProductService } from '../product/infrastructure/product.service';
import { ProductRepository } from '../product/infrastructure/product.repository';
import { OrderItemController } from './presentation/order.item.controller';
import { OrderItemDiscountsUpdateUsecase } from './application/order-item-discount.usercase';
import { OrderItemTaxRecordUpdateUsecase } from './application/order-item-tax.usercase';

@Module({
  imports: [DatabaseModule],
  controllers: [OrderController, OrderItemController],
  providers: [
    OrderService,
    InvoiceService,
    OrderRepository,
    BusinessService,
    InvoiceRepository,
    BusinessRepository,
    OrderItemRepository,
    OrderItemService,
    OrderItemCreateUsecase,
    OrderItemUpdateUsecase,
    OrderItemDiscountsUpdateUsecase,
    OrderItemTaxRecordUpdateUsecase,
    ProductService,
    ProductRepository,
    OrderItemDeleteUsecase,
    OrderCreateUsecase,
    OrderUpdateUsecase,
    OrderDeleteUsecase,
  ],
})
export class OrderModule {}
