import { Injectable } from '@nestjs/common';
import { ClerkAuthService } from '../infrastructure/auth.service';
import { BusinessType, UserRole } from '../../../types/auth';

@Injectable()
export class AuthUseCase {
  constructor(private readonly clerkAuthService: ClerkAuthService) {}

  // as business owner, create business organization with business type
  async createOrganization(
    name: string,
    userId: string,
    businessType: BusinessType,
  ) {
    return this.clerkAuthService.createOrganization(name, userId, businessType);
  }

  // as business owner, update business organization with business type and name
  async updateOrganization(
    name: string | null | undefined,
    businessType: BusinessType | null | undefined,
    orgId: string | null | undefined,
  ) {
    return this.clerkAuthService.updateOrganization(name, orgId!, businessType);
  }

  // as business owner, delete business organization
  async deleteOrganization(orgId: string) {
    return this.clerkAuthService.deleteOrganization(orgId);
  }

  // as business admin, invite user to organization
  async inviteUserToOrganization(
    emails: string[],
    orgId: string,
    role: UserRole,
    inviterUserId: string,
  ) {
    return this.clerkAuthService.inviteUserToOrganization(
      emails,
      orgId,
      role,
      inviterUserId,
    );
  }

  // as business admin, resend invite to user
  async resendInviteToUser(email: string, orgId: string, userId: string) {
    return await this.clerkAuthService.resendInviteToUser(email, orgId, userId);
  }

  // as business admin, revoke invite to user
  async revokeInviteToUser(
    invitationId: string,
    orgId: string,
    userId: string,
  ) {
    return await this.clerkAuthService.revokeInviteToUser(
      invitationId,
      orgId,
      userId,
    );
  }

  // as business admin, remove user from business organization
  async removeUserFromOrganization(userId: string, orgId: string) {
    return await this.clerkAuthService.removeUserFromOrganization(
      userId,
      orgId,
    );
  }
}
