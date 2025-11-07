import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { AuditLogsRepository } from './infrastructure/audit-logs.repository';
import { AuditLogsService } from './infrastructure/audit-logs.service';

@Module({
  imports: [DatabaseModule],
  controllers: [],
  providers: [AuditLogsRepository, AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditModule {}
