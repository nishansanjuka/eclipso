import { sql } from 'drizzle-orm';
import { timestamp } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { numeric } from 'drizzle-orm/pg-core';

export const invoices = pgTable('invoice', {
  id: uuid('id').defaultRandom().unique().notNull(),
  invoiceNumber: text('invoice_number')
    .notNull()
    .unique()
    .default(sql`'in_' || replace(gen_random_uuid()::text, '-', '')`),
  totalTax: numeric('total_tax', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  totalDiscount: numeric('total_discount', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  subTotal: numeric('sub_total', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  grandTotal: numeric('grand_total', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
