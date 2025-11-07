import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserCreateDto } from '../dto/user.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(userData: UserCreateDto) {
    return this.userRepository.createUser(userData);
  }

  async deleteUser(clerkId: string) {
    return await this.userRepository.deleteUserByClerkId(clerkId);
  }

  async getUserByClerkId(clerkId: string) {
    return await this.userRepository.getUserByClerkId(clerkId);
  }
}
