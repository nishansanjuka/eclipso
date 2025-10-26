import { type ClerkClient } from '@clerk/express';
import { Inject, Injectable } from '@nestjs/common';
import {
  BusinessPublicMetadata,
  BusinessType,
  UserPermissions,
  UserRole,
} from '../../../types/auth';
import { AuthUserEntity } from '../domain/user.entity';
import { mapEmailsToInvitations } from '../../../shared/utils/email-to-invitation.mapper';

@Injectable()
export class ClerkAuthService {
  constructor(
    @Inject('CLERK_CLIENT') private readonly clerkClient: ClerkClient,
  ) {}
  async getUser(userId: string) {
    const res = await this.clerkClient.users.getUser(userId);

    const email =
      res.primaryEmailAddress?.emailAddress ??
      res.emailAddresses?.[0]?.emailAddress ??
      '';

    const role =
      (res.publicMetadata?.role as UserRole | undefined) ??
      ('org:member' as UserRole);

    const permissions = Array.isArray(res.publicMetadata?.permissions)
      ? (res.publicMetadata?.permissions as UserPermissions[])
      : [];

    const isActive = res.locked !== true;

    return new AuthUserEntity(res.id, email, role, permissions, isActive);
  }

  async createOrganization(
    name: string,
    userId: string,
    businessType: BusinessType,
  ) {
    return await this.clerkClient.organizations.createOrganization({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      createdBy: userId,
      publicMetadata: {
        businessType,
      } as BusinessPublicMetadata,
    });
  }

  async updateOrganization(
    name: string | null | undefined,
    orgId: string,
    businessType: BusinessType | null | undefined,
  ) {
    return await this.clerkClient.organizations.updateOrganization(orgId, {
      name: name ?? undefined,
      publicMetadata: {
        businessType: businessType ?? undefined,
      } as BusinessPublicMetadata,
      slug: name ? name.toLowerCase().replace(/\s+/g, '-') : undefined,
    });
  }

  async deleteOrganization(orgId: string) {
    return await this.clerkClient.organizations.deleteOrganization(orgId);
  }

  async inviteUserToOrganization(
    emails: string[],
    orgId: string,
    role: UserRole,
    inviterUserId: string,
  ) {
    const invitations = mapEmailsToInvitations(emails, role, inviterUserId);

    return await this.clerkClient.organizations.createOrganizationInvitationBulk(
      orgId,
      invitations,
    );
  }

  async resendInviteToUser(email: string, orgId: string, userId: string) {
    const res =
      await this.clerkClient.organizations.getOrganizationInvitationList({
        organizationId: orgId,
      });
    const invitation = res.data.find(
      (invitation) => invitation.emailAddress === email,
    );

    return await this.inviteUserToOrganization(
      [email],
      orgId,
      invitation?.role as UserRole,
      userId,
    );
  }

  async revokeInviteToUser(
    invitationId: string,
    orgId: string,
    userId: string,
  ) {
    return await this.clerkClient.organizations.revokeOrganizationInvitation({
      invitationId,
      requestingUserId: userId,
      organizationId: orgId,
    });
  }

  async removeUserFromOrganization(userId: string, orgId: string) {
    const res =
      await this.clerkClient.organizations.deleteOrganizationMembership({
        organizationId: orgId,
        userId: userId,
      });

    await this.clerkClient.users.deleteUser(userId);

    return res;
  }
}
