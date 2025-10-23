import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserEntity } from '../domain/user.entity';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(userData: Omit<UserEntity, 'id'>) {
    return this.userRepository.createUser(userData);
  }

  async getUserById(id: string) {
    return this.userRepository.findUserById(id);
  }

  async getUserByBusinessId(businessId: string) {
    return this.userRepository.findUserByBusinessId(businessId);
  }

  async updateUserById(
    id: string,
    updateData: Partial<Omit<UserEntity, 'id'>>,
  ) {
    return this.userRepository.updateUserById(id, updateData);
  }

  async updateUserByClerkId(
    id: string,
    updateData: Partial<Omit<UserEntity, 'id'>>,
  ) {
    return this.userRepository.updateUserByClerkId(id, updateData);
  }

  async deleteUserById(id: string) {
    return this.userRepository.deleteUserById(id);
  }
}
