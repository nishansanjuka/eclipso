import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { BusinessRepository } from './infrastructure/business.repository';
import { BusinessService } from './infrastructure/business.service';

@Module({
  imports: [DatabaseModule],
  controllers: [],
  providers: [BusinessRepository, BusinessService],
})
export class BusinessModule {}
