import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AuthController } from './presentation/auth.controller';
import { AuthUseCase } from './application/auth-use-case';
import { ClerkAuthService } from './infrastructure/auth.service';
import AuthMiddleware from '../../shared/middleware/auth-middlerware';
import { ClerkClientProvider } from './infrastructure/auth.provider';
import { UserService } from '../users/infrastructure/user.service';
import { UserRepository } from '../users/infrastructure/user.repository';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { ClerkWebhookController } from './presentation/webhook.controller';
import { WebhookSignatureMiddleware } from '../../shared/middleware/auth.webhook-middleware';
import { ConfigService } from '../../shared/services/config.service';
import { ClerkWebhookService } from './infrastructure/webhook.service';
import { ClerkWebhookUseCase } from './application/webhook.use-case';
import { BusinessService } from '../business/infrastructure/business.service';
import { BusinessRepository } from '../business/infrastructure/business.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController, ClerkWebhookController],
  providers: [
    AuthUseCase,
    ClerkAuthService,
    ClerkClientProvider,
    ConfigService,
    ClerkWebhookService,
    ClerkWebhookUseCase,
    UserService,
    UserRepository,
    BusinessService,
    BusinessRepository,
  ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes({
      path: '/auth/clerk/organization',
      method: RequestMethod.ALL,
    });

    consumer.apply(WebhookSignatureMiddleware).forRoutes({
      path: '/auth/webhook',
      method: RequestMethod.ALL,
    });
  }
}
