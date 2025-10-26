import { timestamp } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { BusinessType } from '../../../auth/enums/business-type.enum';

export const businessTypeEnum = pgEnum('business_type', BusinessType);

export const businesses = pgTable('businesses', {
  id: uuid('id').defaultRandom().unique().notNull(),
  name: text('name').notNull(),
  orgId: text('org_id').notNull().unique(),
  businessType: businessTypeEnum('business_type').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
