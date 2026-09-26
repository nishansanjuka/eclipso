import { timestamp } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { integer, pgTable, uuid } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { BusinessType } from '../../../auth/enums/business-type.enum';

export const businessTypeEnum = pgEnum('business_type', BusinessType);

export const businesses = pgTable('businesses', {
  id: uuid('id').defaultRandom().unique().notNull(),
  name: text('name').notNull(),
  orgId: text('org_id').notNull().unique(),
  businessType: businessTypeEnum('business_type').notNull(),
  /** Last issued sale number; bumped atomically per sale (receipt numbering). */
  saleSeq: integer('sale_seq').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
