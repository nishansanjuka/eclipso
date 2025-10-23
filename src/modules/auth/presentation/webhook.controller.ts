import { Controller, Post, Body, Put, Req } from '@nestjs/common';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';
import { UserService } from '../../users/infrastructure/user.service';
import { User } from '../../../shared/decorators/auth.decorator';
import { type AuthUserObject } from '../../../types/globals';
import { UserUpdateDto } from '../../users/dto/user.dto';
import * as express from 'express';

@Controller('auth/webhook')
export class ClerkWebhookController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @CatchEntityErrors()
  handleWebhook(@Req() req: express.Request): { received: boolean } {
    console.log(req.clerkEvent);
    return { received: true };
  }

  @Put()
  @CatchEntityErrors()
  updateUser(
    @User() userData: AuthUserObject,
    @Body() userDto: UserUpdateDto,
  ): UserUpdateDto {
    // const res = await this.userService.updateUserByClerkId(
    //   userData.userId!,
    //   userDto,
    // );
    // return res;
    return userDto;
  }
}
