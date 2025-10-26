import { AuthObject, WebhookEvent } from '@clerk/express';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as express from 'express';
import { AuthUserObject } from '../../types/globals';

export const Auth = createParamDecorator(
  (
    data: unknown,
    ctx: ExecutionContext,
  ): (AuthObject & ((options?: unknown) => AuthObject)) | undefined => {
    const request = ctx.switchToHttp().getRequest<express.Request>();
    return request.auth;
  },
);

export const User = createParamDecorator(
  (data: unknown, context: ExecutionContext): AuthUserObject => {
    const request = context.switchToHttp().getRequest<express.Request>();
    return request.user;
  },
);

export const ClerkEvent = createParamDecorator(
  (
    data: unknown,
    ctx: ExecutionContext,
  ): (WebhookEvent & ((options?: unknown) => WebhookEvent)) | undefined => {
    const request = ctx.switchToHttp().getRequest<express.Request>();
    return (request.clerkEvent ?? undefined) as
      | (WebhookEvent & ((options?: unknown) => WebhookEvent))
      | undefined;
  },
);
