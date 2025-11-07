import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configuration } from './shared/config';
import { ConfigService } from './shared/services/config.service';
import { AuthModule } from './modules/auth/auth.module';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UsersModule } from './modules/users/user.module';
import { BusinessModule } from './modules/business/business.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { TaxModule } from './modules/tax/tax.module';
import { DiscountModule } from './modules/discount/discount.module';
import { OrderModule } from './modules/order/order.module';
import { ProductModule } from './modules/product/product.module';
import { BrandModule } from './modules/brand/brand.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuditInterceptor } from './shared/interceptors/audit.interceptor';
import { AdjustmentModule } from './modules/adjustment/adjustment.module';
import { SaleModule } from './modules/sale/sale.module';
import { ReturnModule } from './modules/return/return.module';
import { CustomerModule } from './modules/customer/customer.module';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TaxModule,
    UsersModule,
    AuthModule,
    BusinessModule,
    SuppliersModule,
    ProductModule,
    DiscountModule,
    OrderModule,
    BrandModule,
    InvoiceModule,
    AuditModule,
    AdjustmentModule,
    CustomerModule,
    SaleModule,
    ReturnModule,
  ],
  controllers: [],
  providers: [
    ConfigService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
