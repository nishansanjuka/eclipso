import { Controller, Post, Get, Param } from '@nestjs/common';
import { UserEntity } from '../domain/user.entity';
import { UserService } from '../infrastructure/user.service';
import { CatchEntityErrors } from '../../../shared/decorators/exception.validator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @CatchEntityErrors()
  // async createUser(
  //   @Body() userDto: Omit<UserEntity, 'id'>,
  // ): Promise<UserEntity> {
  //   const user = new UserEntity({ id: 'id', ...userDto });
  //   return this.userService.createUser(user);
  // }
  @Get(':id')
  @CatchEntityErrors()
  async getUserById(@Param('id') id: string): Promise<UserEntity> {
    return this.userService.getUserById(id);
  }

  @Get(':businessId')
  @CatchEntityErrors()
  async getUserByBusinessId(
    @Param('businessId') businessId: string,
  ): Promise<UserEntity> {
    return this.userService.getUserByBusinessId(businessId);
  }
}
