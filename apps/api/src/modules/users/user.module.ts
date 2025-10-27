import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { UserRepository } from './infrastructure/user.repository';
import { UserController } from './presentation/user.controller';
import { UserService } from './infrastructure/user.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserRepository, UserService],
  exports: [UserRepository],
})
export class UsersModule {}
