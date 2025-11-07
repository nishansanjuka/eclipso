import {
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { returns } from './return.schema';
import { users } from '../../../users/infrastructure/schema/user.schema';
import { RefundMethodEnum } from '../enums/return.enum';

export const refundMethodEnum = pgEnum('refund_method', [
  RefundMethodEnum.CASH,
  RefundMethodEnum.CARD,
  RefundMethodEnum.BANK_TRANSFER,
  RefundMethodEnum.STORE_CREDIT,
]);

export const refunds = pgTable('refunds', {
  id: uuid('id').defaultRandom().primaryKey(),
  returnId: uuid('return_id')
    .notNull()
    .unique()
    .references(() => returns.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  method: refundMethodEnum('method').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull().default('0'),
  reason: text('reason'),
  transactionRef: text('transaction_ref'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
