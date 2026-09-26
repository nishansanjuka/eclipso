import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { businesses } from '../../../business/infrastructure/schema/business.schema';

export const branchKindEnum = pgEnum('branch_kind', ['store', 'warehouse']);

/**
 * A physical location of a business (e.g. "Kottawa", "Maharagama"). Stock and
 * sales belong to a branch; the catalog (products, taxes, ...) is shared by the
 * whole business. Every business has exactly one default branch, so a
 * single-location shop never has to think about branches.
 *
 * Branches are never hard-deleted through the API: history (sales, stock
 * movements) points at them, so a closed branch is deactivated instead.
 */
export const branches = pgTable(
  'branches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    /** Short unique label, upper-case (e.g. KOTTAWA). */
    code: text('code').notNull(),
    name: text('name').notNull(),
    address: text('address'),
    /** A store takes money; a warehouse only holds stock (no registers). */
    kind: branchKindEnum('kind').notNull().default('store'),
    /** Tills that can run at the same time in this branch. */
    registerCount: integer('register_count').notNull().default(1),
    isDefault: boolean('is_default').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('branches_business_code_uq').on(t.businessId, t.code),
    // At most one default per business.
    uniqueIndex('branches_one_default_uq')
      .on(t.businessId)
      .where(sql`${t.isDefault}`),
    check(
      'branches_default_is_active',
      sql`not ${t.isDefault} or ${t.isActive}`,
    ),
  ],
);
