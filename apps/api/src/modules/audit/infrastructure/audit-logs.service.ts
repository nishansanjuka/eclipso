import { Injectable } from '@nestjs/common';
import { AuditLogsRepository } from './audit-logs.repository';
import { AuditLogsCreateDto } from '../dto/audit-logs.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  async createLog(entry: AuditLogsCreateDto): Promise<void> {
    await this.auditLogsRepository.create(entry);
  }

  async getLogsByUser(userId: string) {
    return await this.auditLogsRepository.findById(userId);
  }

  async deleteLog(id: string): Promise<void> {
    await this.auditLogsRepository.delete(id);
  }
}
