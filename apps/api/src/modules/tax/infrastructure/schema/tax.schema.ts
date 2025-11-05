import { pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { businesses } from '../../../business/infrastructure/schema/business.schema';
import { boolean } from 'drizzle-orm/pg-core';
import { TaxType } from '../../enums/tax.types.enum';

export const taxTypeEnum = pgEnum('tax_type', TaxType);

export const taxes = pgTable('tax', {
  id: uuid('id').defaultRandom().unique().notNull(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id),
  name: text('name').notNull(),
  rate: integer('rate').notNull().default(0),
  type: taxTypeEnum('type').notNull(),
  isActive: boolean('is_active').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
