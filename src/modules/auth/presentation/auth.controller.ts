import { Controller, Get, Req } from '@nestjs/common';
import { AuthUseCase } from '../application/auth-use-case';
import express from 'express';

@Controller('auth/users')
export class AuthController {
  constructor(private readonly authUseCase: AuthUseCase) {}

  @Get('me')
  async getMe(@Req() req: express.Request) {
    const { userId } = req.user;
    return this.authUseCase.getProfile(userId!);
  }
}
