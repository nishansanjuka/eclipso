import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AuthController } from './presentation/auth.controller';
import AuthMiddleware from '../../shared/middleware/auth-middlerware';
import { AccessManagementUseCase } from './application/access-management.use-case';
import { AccessRepository } from './infrastructure/access.repository';
import { AccessService } from './infrastructure/access.service';
import { UsersModule } from '../users/user.module';
import { BusinessModule } from '../business/business.module';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { ClerkWebhookController } from './presentation/webhook.controller';
import { WebhookSignatureMiddleware } from '../../shared/middleware/auth.webhook-middleware';
import { ConfigService } from '../../shared/services/config.service';
import { ClerkWebhookService } from './infrastructure/webhook.service';
import { ClerkWebhookUseCase } from './application/webhook.use-case';
import { AdjustmentController } from '../adjustment/presentation/adjustment.controller';
import { BrandController } from '../brand/presentation/brand.controller';
import { CustomerController } from '../customer/presentation/customer.controller';
import { DiscountController } from '../discount/presentation/tax.controller';
import { OrderController } from '../order/presentation/order.controller';
import { OrderItemController } from '../order/presentation/order.item.controller';
import { CategoriesController } from '../product/presentation/category.controller';
import { ProductsController } from '../product/presentation/produt.controller';
import { ReturnController } from '../return/presentation/return.controller';
import { SupplierController } from '../suppliers/presentation/supplier.controller';
import { TaxController } from '../tax/presentation/tax.controller';
import { InvoicesController } from '../invoice/presentation/invoice.controller';
import { SaleController } from '../sale/presentation/sale.controller';
import { BranchController } from '../branch/presentation/branch.controller';
import { ReportController } from '../report/presentation/report.controller';
import { InvitationsController } from '../invitation/presentation/invitation.controller';

@Module({
  imports: [DatabaseModule, UsersModule, BusinessModule],
  controllers: [AuthController, ClerkWebhookController],
  providers: [
    AccessManagementUseCase,
    AccessRepository,
    AccessService,
    ConfigService,
    ClerkWebhookService,
    ClerkWebhookUseCase,
  ],
  exports: [AccessService, AccessRepository],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        AuthController,
        BranchController,
        ReportController,
        InvitationsController,
        SupplierController,
        TaxController,
        InvoicesController,
        SaleController,
        AdjustmentController,
        BrandController,
        CustomerController,
        DiscountController,
        OrderController,
        OrderItemController,
        CategoriesController,
        ProductsController,
        ReturnController,
      );

    consumer.apply(WebhookSignatureMiddleware).forRoutes({
      path: '/auth/webhook',
      method: RequestMethod.ALL,
    });
  }
}
