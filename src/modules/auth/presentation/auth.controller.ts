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
import { type AuthUserObject } from '../../../types/globals';
import {
  CreateOrganizationEntity,
  DeleteOrganizationEntity,
  InviteUserEntity,
  UpdateOrganizationEntity,
} from '../domain/organization.entity';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';

@Controller('/auth/clerk')
export class AuthController {
  constructor(private readonly authUseCase: AuthUseCase) {}

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

  @Delete('organization')
  @CatchEntityErrors()
  async deleteOrganization(@User() user: AuthUserObject) {
    const { orgId } = new DeleteOrganizationEntity({ orgId: user.orgId! });
    return this.authUseCase.deleteOrganization(orgId);
  }

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
