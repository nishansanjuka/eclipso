import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sales } from '../../../sale/infrastructure/schema/sale.schema';
import { users } from '../../../users/infrastructure/schema/user.schema';
import { ReturnReasonEnum, ReturnStatusEnum } from '../enums/return.enum';

export const returnReasonEnum = pgEnum('return_reason', [
  ReturnReasonEnum.DEFECTIVE,
  ReturnReasonEnum.WRONG_ITEM,
  ReturnReasonEnum.NOT_AS_DESCRIBED,
  ReturnReasonEnum.CUSTOMER_CHANGED_MIND,
  ReturnReasonEnum.DAMAGED,
  ReturnReasonEnum.OTHER,
]);

export const returnStatusEnum = pgEnum('return_status', [
  ReturnStatusEnum.PENDING,
  ReturnStatusEnum.APPROVED,
  ReturnStatusEnum.REJECTED,
  ReturnStatusEnum.COMPLETED,
]);

export const returns = pgTable('returns', {
  id: uuid('id').defaultRandom().primaryKey(),
  saleId: uuid('sale_id')
    .notNull()
    .references(() => sales.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  qty: integer('qty').notNull(),
  reason: returnReasonEnum('reason').notNull(),
  status: returnStatusEnum('status')
    .notNull()
    .default(ReturnStatusEnum.PENDING),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
