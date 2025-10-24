import { Injectable } from '@nestjs/common';
import { ClerkAuthService } from '../infrastructure/auth.service';
import { BusinessType } from '../../../types/auth';

@Injectable()
export class AuthUseCase {
  constructor(private readonly clerkAuthService: ClerkAuthService) {}

  async getProfile(userId: string) {
    return this.clerkAuthService.getUser(userId);
  }

  async createOrganization(
    name: string,
    userId: string,
    businessType: BusinessType,
  ) {
    return this.clerkAuthService.createOrganization(name, userId, businessType);
  }
}
