import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { type Request } from 'express';
import { RateLimiter } from '../../../shared/utils/rate-limiter';
import { InvitationUseCase } from '../application/invitation.use-case';

/**
 * No sign-in here: whoever holds the link can see what it is for, which is what
 * lets the page say "Join Aperture Retail" before the invitee has an account.
 * Tokens carry 256 bits of randomness; the limiter only makes guessing pointless.
 */
@Controller('public/invitations')
export class PublicInvitationsController {
  private readonly limiter = new RateLimiter(60, 60_000);

  constructor(private readonly useCase: InvitationUseCase) {}

  @ApiOperation({
    operationId: 'lookupInvitation',
    description:
      'Public. Describes an invitation link: organization, role, branches, inviter and whether it is still usable (pending, accepted, revoked or expired).',
  })
  @ApiParam({ name: 'token', type: String })
  @Get(':token')
  lookup(@Param('token') token: string, @Req() req: Request) {
    if (!this.limiter.allow(req.ip ?? 'unknown')) {
      throw new HttpException(
        'Too many requests, try again in a minute.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return this.useCase.lookup(token);
  }
}
