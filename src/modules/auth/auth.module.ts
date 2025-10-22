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

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController, ClerkWebhookController],
  providers: [
    AuthUseCase,
    ClerkAuthService,
    ClerkClientProvider,
    UserService,
    UserRepository,
  ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
