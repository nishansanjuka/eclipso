import {
  pgTable,
  uuid,
  numeric,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sales } from '../../../sale/infrastructure/schema/sale.schema';
import { PaymentMethodEnum, PaymentStatusEnum } from '../enums/payment.enum';

export const paymentMethodEnum = pgEnum('payment_method', [
  PaymentMethodEnum.CASH,
  PaymentMethodEnum.CARD,
  PaymentMethodEnum.BANK_TRANSFER,
  PaymentMethodEnum.MOBILE_PAYMENT,
  PaymentMethodEnum.CHECK,
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  PaymentStatusEnum.PENDING,
  PaymentStatusEnum.COMPLETED,
  PaymentStatusEnum.FAILED,
  PaymentStatusEnum.REFUNDED,
]);

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().unique().notNull(),
  saleId: uuid('sale_id').references(() => sales.id),
  method: paymentMethodEnum('method').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull().default('0'),
  status: paymentStatusEnum('status')
    .notNull()
    .default(PaymentStatusEnum.PENDING),
  transactionRef: text('transaction_ref'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
