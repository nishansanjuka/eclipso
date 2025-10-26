import { Controller, Post } from '@nestjs/common';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';
import { ClerkEvent } from '../../../shared/decorators/auth.decorator';
import { type WebhookEvent } from '@clerk/express';
import { ClerkWebhookUseCase } from '../application/webhook.use-case';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('auth/webhook')
export class ClerkWebhookController {
  constructor(private readonly webhookUseCase: ClerkWebhookUseCase) {}

  @Post()
  @CatchEntityErrors()
  async handleWebhook(@ClerkEvent() event: WebhookEvent) {
    return await this.webhookUseCase.handleWebhook(event);
  }
}
