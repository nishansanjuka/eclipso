import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { type AuthUserObject } from '../../../../globals';
import { User } from '../../../shared/decorators/auth.decorator';
import {
  AllowWithoutBusiness,
  RequirePermissions,
} from '../../../shared/decorators/require-permissions.decorator';
import { parseBody } from '../../auth/dto/auth.dto';
import { PermissionType } from '../../auth/enums/auth-permissions.enum';
import { InvitationUseCase } from '../application/invitation.use-case';
import {
  AcceptInvitationDto,
  CreateInvitationsDto,
  acceptInvitationSchema,
  createInvitationsSchema,
} from '../dto/invitation.dto';

/** Signed-in side: manage invitations of the current business, or accept one. */
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly useCase: InvitationUseCase) {}

  @ApiOperation({
    operationId: 'listInvitations',
    description:
      'Invitations of the current business, newest first. Status is pending, accepted, revoked or expired. Requires member:read.',
  })
  @RequirePermissions(PermissionType.MEMBER_READ)
  @Get()
  list(@User() user: AuthUserObject) {
    return this.useCase.list(user);
  }

  @ApiOperation({
    operationId: 'createInvitations',
    description:
      'Invites people by email into a role (optionally limited to some branches) and emails each a link to the workspace. Inviting an email that already has a pending invitation re-issues it. Returns one result per email, with the link as a fallback if the email could not be sent. Requires member:manage.',
  })
  @ApiBody({ type: CreateInvitationsDto })
  @RequirePermissions(PermissionType.MEMBER_MANAGE)
  @Post()
  create(@User() user: AuthUserObject, @Body() body: unknown) {
    const { invitations } = parseBody(createInvitationsSchema, body);
    return this.useCase.create(user, invitations);
  }

  @ApiOperation({
    operationId: 'resendInvitation',
    description:
      'Sends a pending invitation again with a fresh link and a new expiry. The previous link stops working. Requires member:manage.',
  })
  @ApiParam({ name: 'id', type: String })
  @RequirePermissions(PermissionType.MEMBER_MANAGE)
  @Post(':id/resend')
  resend(@User() user: AuthUserObject, @Param('id', ParseUUIDPipe) id: string) {
    return this.useCase.resend(user, id);
  }

  @ApiOperation({
    operationId: 'revokeInvitation',
    description:
      'Revokes a pending invitation; its link stops working immediately. Requires member:manage.',
  })
  @ApiParam({ name: 'id', type: String })
  @RequirePermissions(PermissionType.MEMBER_MANAGE)
  @Delete(':id')
  revoke(@User() user: AuthUserObject, @Param('id', ParseUUIDPipe) id: string) {
    return this.useCase.revoke(user, id);
  }

  @ApiOperation({
    operationId: 'acceptInvitation',
    description:
      'Joins the business from an invitation link. The signed-in user must control the invited email (verified). Works once, before it expires.',
  })
  @ApiBody({ type: AcceptInvitationDto })
  @AllowWithoutBusiness()
  @Post('accept')
  accept(@User() user: AuthUserObject, @Body() body: unknown) {
    const { token } = parseBody(acceptInvitationSchema, body);
    return this.useCase.accept(user.userId, token);
  }
}
