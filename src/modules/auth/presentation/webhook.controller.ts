import { Controller, Post, Body } from '@nestjs/common';
import { CatchEntityErrors } from '../../../shared/decorators/exception.validator';
import { UserService } from '../../users/infrastructure/user.service';
import { UserEntity } from '../../users/domain/user.entity';

@Controller('webhook/clerk')
export class ClerkWebhookController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @CatchEntityErrors()
  async createUser(
    @Body() userDto: Omit<UserEntity, 'id'>,
  ): Promise<UserEntity> {
    const user = new UserEntity({ id: 'id', ...userDto });
    return this.userService.createUser(user);
  }
}
