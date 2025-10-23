import { Controller, Post, Get, Param } from '@nestjs/common';
import { UserService } from '../infrastructure/user.service';
import { CatchEntityErrors } from 'src/shared/decorators/exception.catcher';
import { UserCreateDto } from '../dto/user.dto';

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
  async getUserById(@Param('id') id: string): Promise<UserCreateDto> {
    return this.userService.getUserById(id);
  }

  @Get(':businessId')
  @CatchEntityErrors()
  async getUserByBusinessId(
    @Param('businessId') businessId: string,
  ): Promise<UserCreateDto> {
    return this.userService.getUserByBusinessId(businessId);
  }
}
