import { ApiProperty } from '@nestjs/swagger';
import { ActionType, LogType } from '../enums/audit-logs.enum';

export class AuditLogsCreateDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  orgId: string;

  @ApiProperty({ enum: ActionType })
  action: ActionType;

  @ApiProperty({ enum: LogType })
  logType: LogType;

  @ApiProperty()
  resource: string;

  @ApiProperty({ required: false })
  resourceId?: string;

  @ApiProperty({ required: false, type: Object })
  oldValues?: Record<string, any>;

  @ApiProperty({ required: false, type: Object })
  newValues?: Record<string, any>;

  @ApiProperty({ required: false, type: Object })
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;
}
