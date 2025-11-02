import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configuration } from './shared/config';
import { ConfigService } from './shared/services/config.service';
import { AuthModule } from './modules/auth/auth.module';
import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/user.module';
import { BusinessModule } from './modules/business/business.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { CategoriesModule } from './modules/product/product.module';
import { TaxModule } from './modules/tax/tax.module';
import { DiscountModule } from './modules/discount/discount.module';

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
    CategoriesModule,
    DiscountModule,
  ],
  controllers: [],
  providers: [ConfigService],
})
export class AppModule {}
