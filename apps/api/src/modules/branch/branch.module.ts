import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { AuthModule } from '../auth/auth.module';
import { BranchUseCase } from './application/branch.use-case';
import { BranchRepository } from './infrastructure/branch.repository';
import { BranchController } from './presentation/branch.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [BranchController],
  providers: [BranchRepository, BranchUseCase],
})
export class BranchModule {}
