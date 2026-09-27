import { Injectable } from '@nestjs/common';
import { WebhookEvent } from '@clerk/express';
import { ClerkWebhookService } from '../infrastructure/webhook.service';
import { logDebug } from '@eclipso/utils';

/**
 * Clerk is only the identity provider: we mirror user lifecycle events and
 * ignore everything organization-related (businesses, roles and memberships
 * live in our own tables).
 */
@Injectable()
export class ClerkWebhookUseCase {
  constructor(private readonly webhookService: ClerkWebhookService) {}

  async handleWebhook(event: WebhookEvent) {
    logDebug('Received webhook event:', event.type);

    switch (event.type) {
      case 'user.created':
        await this.webhookService.handleUserCreated(event);
        break;
      case 'user.updated':
        await this.webhookService.handleUserUpdated(event);
        break;
      case 'user.deleted':
        await this.webhookService.handleUserDeleted(event);
        break;
    }
    return { received: true };
  }
}
