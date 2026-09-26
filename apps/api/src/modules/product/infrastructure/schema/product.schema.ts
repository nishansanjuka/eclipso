import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { timestamp } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { businesses } from '../../../business/infrastructure/schema/business.schema';
import { suppliers } from '../../../suppliers/infrastructure/schema/supplier.schema';
import { jsonb } from 'drizzle-orm/pg-core';
import { brands } from '../../../brand/infrastructure/schema/brand.schema';

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().unique().notNull(),
  businessId: uuid('business_id')
    .references(() => businesses.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  // Deleting a supplier must not wipe out its products (and their sales).
  supplierId: uuid('supplier_id')
    .references(() => suppliers.id, {
      onDelete: 'no action',
    })
    .notNull(),
  brandId: uuid('brand_id').references(() => brands.id, {
    onDelete: 'set null',
  }),
  name: text('name').notNull(),
  sku: text('sku').notNull(),
  price: integer('price').notNull().default(0),
  /** Unit cost in minor units; optional (imports and receiving set it). */
  costPrice: integer('cost_price'),
  barcode: text('barcode'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
