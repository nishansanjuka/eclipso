import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { AuthUseCase } from '../application/auth-use-case';
import {
  CreateOrganizationDto,
  InviteUserDto,
  UpdateOrganizationDto,
} from '../dto/auth.dto';
import { User } from '../../../shared/decorators/auth.decorator';
import { type AuthUserObject } from '../../../../globals';
import {
  CreateOrganizationEntity,
  DeleteOrganizationEntity,
  InviteUserEntity,
  UpdateOrganizationEntity,
} from '../domain/organization.entity';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';

@Controller('/auth/clerk')
export class AuthController {
  constructor(private readonly authUseCase: AuthUseCase) {}

  @ApiOperation({ operationId: 'createOrganization' })
  @ApiBody({ type: CreateOrganizationDto })
  @Post('organization')
  @CatchEntityErrors()
  async createOrganization(
    @User() user: AuthUserObject,
    @Body() body: CreateOrganizationDto,
  ) {
    const { businessType, name } = new CreateOrganizationEntity(body);
    return this.authUseCase.createOrganization(
      name,
      user.userId!,
      businessType,
    );
  }

  @ApiOperation({ operationId: 'updateOrganization' })
  @ApiBody({ type: UpdateOrganizationDto })
  @Put('organization')
  @CatchEntityErrors()
  async updateOrganization(
    @User() user: AuthUserObject,
    @Body() body: UpdateOrganizationDto,
  ) {
    const { businessType, name, orgId } = new UpdateOrganizationEntity({
      ...body,
      orgId: user.orgId,
    });
    return this.authUseCase.updateOrganization(name, businessType, orgId);
  }

  @ApiOperation({ operationId: 'deleteOrganization' })
  @Delete('organization')
  @CatchEntityErrors()
  async deleteOrganization(@User() user: AuthUserObject) {
    const { orgId } = new DeleteOrganizationEntity({ orgId: user.orgId! });
    return this.authUseCase.deleteOrganization(orgId);
  }

  @ApiOperation({ operationId: 'dt1' })
  @ApiBody({ type: InviteUserDto })
  @Post('organization/invite')
  @CatchEntityErrors()
  async inviteUserToOrganization(
    @User() user: AuthUserObject,
    @Body() body: InviteUserDto,
  ) {
    const { emails, role, orgId, inviterUserId } = new InviteUserEntity({
      ...body,
      orgId: user.orgId!,
      inviterUserId: user.userId!,
    });
    return this.authUseCase.inviteUserToOrganization(
      emails,
      orgId!,
      role!,
      inviterUserId!,
    );
  }

  @ApiParam({ name: 'email', type: String, required: true })
  @Patch('organization/invite/resend/:email')
  @CatchEntityErrors()
  async checkInvitationsExistence(
    @Param('email') email: string,
    @User() user: AuthUserObject,
  ) {
    const { emails, orgId, inviterUserId } = new InviteUserEntity({
      emails: [email],
      orgId: user.orgId!,
      inviterUserId: user.userId!,
    });

    return await this.authUseCase.resendInviteToUser(
      emails[0],
      orgId!,
      inviterUserId!,
    );
  }

  @ApiOperation({ operationId: 'revokeInviteToUser' })
  @ApiParam({ name: 'invitationId', type: String, required: true })
  @Delete('organization/invite/revoke/:invitationId')
  @CatchEntityErrors()
  async revokeInviteToUser(
    @Param('invitationId') invitationId: string,
    @User() user: AuthUserObject,
  ) {
    return await this.authUseCase.revokeInviteToUser(
      invitationId,
      user.orgId!,
      user.userId!,
    );
  }

  @ApiOperation({ operationId: 'deleteUserFromOrganization' })
  @ApiParam({ name: 'userId', type: String, required: true })
  @Delete('organization/user/:userId')
  @CatchEntityErrors()
  async removeUserFromOrganization(
    @Param('userId') userId: string,
    @User() user: AuthUserObject,
  ) {
    return await this.authUseCase.removeUserFromOrganization(
      userId,
      user.orgId!,
    );
  }
}
