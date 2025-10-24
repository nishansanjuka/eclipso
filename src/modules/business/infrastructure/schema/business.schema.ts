import { timestamp } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { BusinessTypeObject } from '../../../../types/auth';
import { pgEnum } from 'drizzle-orm/pg-core';

export const businessTypeEnum = pgEnum(
  'business_type',
  Object.values(BusinessTypeObject) as [string, ...string[]],
);

export const businesses = pgTable('businesses', {
  id: uuid('id').defaultRandom().unique().notNull(),
  name: text('name').notNull(),
  orgId: text('org_id').notNull().unique(),
  businessType: businessTypeEnum('business_type').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
