import { Injectable } from '@nestjs/common';
import { ClerkAuthService } from '../infrastructure/auth.service';
import { BusinessType } from '../../../types/auth';

@Injectable()
export class AuthUseCase {
  constructor(private readonly clerkAuthService: ClerkAuthService) {}

  async getProfile(userId: string) {
    return this.clerkAuthService.getUser(userId);
  }

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
}
