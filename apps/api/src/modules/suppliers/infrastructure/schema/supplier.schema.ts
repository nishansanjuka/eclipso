import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { businesses } from '../../../business/infrastructure/schema/business.schema';

export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().unique().notNull(),
  businessId: uuid('business_id')
    .references(() => businesses.id)
    .notNull(),
});
