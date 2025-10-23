import { type ClerkClient } from '@clerk/express';
import { Inject, Injectable } from '@nestjs/common';
import { UserPermissions, UserRole } from '../../../types/auth';
import { AuthUserEntity } from '../domain/user.entity';

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

  async createOrganization(name: string, userId: string) {
    return await this.clerkClient.organizations.createOrganization({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      createdBy: userId,
    });
  }
}
