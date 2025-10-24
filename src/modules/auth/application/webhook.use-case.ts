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
        await this.webhookService.handleUserCreated(event);
        break;
      case 'organization.created':
        await this.webhookService.handleOrganizationCreated(event);
        break;
    }
    return { received: true };
  }
}
