import { UserJSON, UserWebhookEvent } from '@clerk/express';
import { Injectable } from '@nestjs/common';
import { UserService } from '../../users/infrastructure/user.service';
import { ClerkAuthService } from './auth.service';
import { OwnerPublicMetadata } from '../../../types/auth';

@Injectable()
export class ClerkWebhookService {
  constructor(
    private readonly userService: UserService,
    private readonly authService: ClerkAuthService,
  ) {}

  async handleUserCreated(event: UserWebhookEvent) {
    const userData = event.data as UserJSON & {
      public_metadata: OwnerPublicMetadata;
    };

    const {
      id,
      public_metadata: { businessName },
    } = userData;

    const org_res = await this.authService.createOrganization(businessName, id);
    console.log('Created organization:', org_res);

    await this.userService.createUser({
      businessId: org_res.id,
      clerkId: id,
      name: userData.first_name + ' ' + userData.last_name,
    });
  }
}
