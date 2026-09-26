import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { ReportUseCase } from './application/report.use-case';
import { ReportRepository } from './infrastructure/report.repository';
import { ReportController } from './presentation/report.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ReportController],
  providers: [ReportRepository, ReportUseCase],
})
export class ReportModule {}
