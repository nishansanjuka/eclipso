import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { ClerkIdentityService } from '../../shared/services/clerk-identity.service';
import { MailService } from '../../shared/services/mail.service';
import { AuthModule } from '../auth/auth.module';
import { BusinessModule } from '../business/business.module';
import { InvitationUseCase } from './application/invitation.use-case';
import { InvitationRepository } from './infrastructure/invitation.repository';
import { InvitationsController } from './presentation/invitation.controller';
import { PublicInvitationsController } from './presentation/public-invitation.controller';

@Module({
  imports: [DatabaseModule, AuthModule, BusinessModule],
  controllers: [InvitationsController, PublicInvitationsController],
  providers: [
    InvitationRepository,
    InvitationUseCase,
    MailService,
    ClerkIdentityService,
  ],
})
export class InvitationModule {}
