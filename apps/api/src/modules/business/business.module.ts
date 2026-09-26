import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { BusinessRepository } from './infrastructure/business.repository';
import { BusinessService } from './infrastructure/business.service';
import { PublicWorkspaceController } from './presentation/public-workspace.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [PublicWorkspaceController],
  providers: [BusinessRepository, BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}
