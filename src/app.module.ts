import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configuration } from './shared/config';
import { ConfigService } from './shared/services/config.service';
import authMiddleware from './shared/middleware/auth-middlerware';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
  ],
  controllers: [AppController],
  providers: [AppService, ConfigService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(authMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
