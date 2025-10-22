import { Injectable } from '@nestjs/common';
import { ClerkAuthService } from '../infrastructure/auth.service';

@Injectable()
export class AuthUseCase {
  constructor(private readonly clerkAuthService: ClerkAuthService) {}

  async getProfile(userId: string) {
    return this.clerkAuthService.getUser(userId);
  }
}
