import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from '../../../users/infrastructure/schema/user.schema';
import { businesses } from '../../../business/infrastructure/schema/business.schema';
import { ActionType, LogType } from '../../enums/audit-logs.enum';

export const actionTypeEnum = pgEnum('action_type', ActionType);
export const logTypeEnum = pgEnum('log_type', LogType);

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.clerkId),
  orgId: text('org_id').references(() => businesses.orgId),
  action: actionTypeEnum('action').notNull(),
  logType: logTypeEnum('log_type').notNull(),
  resource: text('resource').notNull(),
  resourceId: uuid('resource_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
