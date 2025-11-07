import {
  pgTable,
  uuid,
  numeric,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';
import { businesses } from '../../../business/infrastructure/schema/business.schema';
import { customers } from '../../../customer/infrastructure/schema/customer.schema';

export const sales = pgTable('sales', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id')
    .references(() => businesses.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  customerId: uuid('customer_id').references(() => customers.id, {
    onDelete: 'cascade',
  }),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  qty: integer('qty').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
