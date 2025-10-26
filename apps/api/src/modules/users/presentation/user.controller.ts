import { Controller } from '@nestjs/common';
import { UserService } from '../infrastructure/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
}
