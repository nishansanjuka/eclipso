import { Injectable } from '@nestjs/common';
import { WebhookEvent } from '@clerk/express';
import { ClerkWebhookService } from '../infrastructure/webhook.service';

@Injectable()
export class ClerkWebhookUseCase {
  constructor(private readonly webhookService: ClerkWebhookService) {}

  async handleWebhook(event: WebhookEvent) {
    console.log(event);

    switch (event.type) {
      case 'user.created':
        // as business owner, I want to create a corresponding user in my system when a new user is created in Clerk
        await this.webhookService.handleUserCreated(event);
        break;
      case 'organization.created':
        // as business owner, I want to create a corresponding business in my system when a new organization is created in Clerk
        await this.webhookService.handleOrganizationCreated(event);
        break;

      case 'organization.updated':
        // as business owner, I want to update the corresponding business in my system when an organization is updated in Clerk
        await this.webhookService.handleOrganizationUpdated(event);
        break;

      case 'organization.deleted':
        // as business owner, I want to delete the corresponding business in my system when an organization is deleted in Clerk
        await this.webhookService.handleOrganizationDeleted(event);
        break;
    }
    return { received: true };
  }
}
