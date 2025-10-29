import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { timestamp } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { businesses } from '../../../business/infrastructure/schema/business.schema';
import { suppliers } from '../../../suppliers/infrastructure/schema/supplier.schema';
import { jsonb } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().unique().notNull(),
  businessId: uuid('business_id')
    .references(() => businesses.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  supplierId: uuid('supplier_id')
    .references(() => suppliers.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  name: text('name').notNull(),
  sku: text('sku').notNull(),
  price: integer('price').notNull().default(0),
  stockQty: integer('stock_qty').notNull().default(0),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
