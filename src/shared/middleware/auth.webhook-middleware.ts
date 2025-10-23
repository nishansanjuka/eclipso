// src/common/middleware/webhook-signature.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { ConfigService } from '../services/config.service';
import { Webhook } from 'svix';
import * as express from 'express';
import { WebhookEvent } from '@clerk/express';
@Injectable()
export class WebhookSignatureMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}
  use(req: express.Request, res: Response, next: NextFunction) {
    const payload = req.body as Record<string, any>;
    const headers = req.headers;

    const svixId = headers['svix-id'] as string;
    const svixTimestamp = headers['svix-timestamp'] as string;
    const svixSignature = headers['svix-signature'] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(400).send('Missing required Svix headers');
    }

    try {
      // Initialize verifier
      const wh = new Webhook(
        this.configService.getAuthConfig().webhook_signing_secret,
      );

      // Verify the payload
      const event = wh.verify(JSON.stringify(payload), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as WebhookEvent;

      req.clerkEvent = event;

      next();
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return res.status(400).send('Invalid signature');
    }
  }
}
