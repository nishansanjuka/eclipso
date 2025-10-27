import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configuration } from './shared/config';
import { ConfigService } from './shared/services/config.service';
import { AuthModule } from './modules/auth/auth.module';
import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/user.module';
import { BusinessModule } from './modules/business/business.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    AuthModule,
    UsersModule,
    BusinessModule,
    SuppliersModule,
  ],
  controllers: [AppController],
  providers: [AppService, ConfigService],
})
export class AppModule {}
