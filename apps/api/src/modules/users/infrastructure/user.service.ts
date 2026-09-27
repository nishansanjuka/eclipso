import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserCreateDto, UserUpdateDto } from '../dto/user.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(userData: UserCreateDto) {
    return this.userRepository.createUser(userData);
  }

  async updateUser(clerkId: string, patch: Omit<UserUpdateDto, 'clerkId' | 'businessId'>) {
    return this.userRepository.updateUserByClerkId(clerkId, patch);
  }

  async deleteUser(clerkId: string) {
    return await this.userRepository.deleteUserByClerkId(clerkId);
  }

  async getUserByClerkId(clerkId: string) {
    return await this.userRepository.getUserByClerkId(clerkId);
  }
}
