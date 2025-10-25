import {
  OrganizationJSON,
  OrganizationMembershipWebhookEvent,
  OrganizationWebhookEvent,
  UserJSON,
  UserWebhookEvent,
} from '@clerk/express';
import { Injectable } from '@nestjs/common';
import { UserService } from '../../users/infrastructure/user.service';
import { BusinessPublicMetadata } from '../../../types/auth';
import { BusinessService } from '../../business/infrastructure/business.service';

@Injectable()
export class ClerkWebhookService {
  constructor(
    private readonly userService: UserService,
    private readonly businessService: BusinessService,
  ) {}

  async handleUserCreated(event: UserWebhookEvent) {
    const userData = event.data as UserJSON;

    await this.userService.createUser({
      clerkId: userData.id,
      name: userData.first_name + ' ' + userData.last_name,
    });
  }

  async handleOrganizationCreated(event: OrganizationWebhookEvent) {
    const { id, name, created_by, public_metadata } =
      event.data as OrganizationJSON & {
        id: string;
        created_by: string;
        public_metadata: BusinessPublicMetadata;
      };

    await this.businessService.createBusiness({
      businessType: public_metadata.businessType,
      orgId: id,
      createdBy: created_by,
      name,
    });
  }

  async handleOrganizationUpdated(event: OrganizationWebhookEvent) {
    const { id, name, public_metadata } = event.data as OrganizationJSON & {
      id: string;
      created_by: string;
      public_metadata: BusinessPublicMetadata;
    };

    await this.businessService.updateBusiness({
      businessType: public_metadata.businessType,
      orgId: id,
      name,
    });
  }

  async handleOrganizationDeleted(event: OrganizationWebhookEvent) {
    const { id } = event.data as OrganizationJSON & {
      id: string;
    };

    await this.businessService.deleteBusiness(id);
  }

  async handleOrganizationMembershipDeleted(
    event: OrganizationMembershipWebhookEvent,
  ) {
    const {
      public_user_data: { user_id },
    } = event.data;

    await this.userService.deleteUser(user_id);
  }
}
