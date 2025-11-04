import { sql } from 'drizzle-orm';
import { timestamp } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';

export const invoices = pgTable('invoice', {
  id: uuid('id').defaultRandom().unique().notNull(),
  invoiceNumber: text('invoice_number')
    .notNull()
    .unique()
    .default(sql`'in_' || replace(gen_random_uuid()::text, '-', '')`),
  totalTax: integer('total_tax').notNull().default(0),
  totalDiscount: integer('total_discount').notNull().default(0),
  subTotal: integer('sub_total').notNull().default(0),
  grandTotal: integer('grand_total').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
