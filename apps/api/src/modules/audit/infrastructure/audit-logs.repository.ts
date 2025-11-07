import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from '../../../shared/database/drizzle.module';
import { auditLogs } from './schema/audit-log.schema';
import { AuditLogsCreateDto } from '../dto/audit-logs.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuditLogsRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async create(data: AuditLogsCreateDto) {
    const [result] = await this.db.insert(auditLogs).values(data).returning();
    return result;
  }

  async findById(id: string) {
    return this.db.select().from(auditLogs).where(eq(auditLogs.id, id));
  }

  async delete(id: string) {
    return this.db.delete(auditLogs).where(eq(auditLogs.id, id));
  }
}
