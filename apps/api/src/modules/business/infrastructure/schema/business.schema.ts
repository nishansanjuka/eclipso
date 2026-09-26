import { boolean, timestamp } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { integer, pgTable, uuid } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { BusinessType } from '../../../auth/enums/business-type.enum';

export const businessTypeEnum = pgEnum('business_type', BusinessType);

export const businesses = pgTable('businesses', {
  id: uuid('id').defaultRandom().unique().notNull(),
  /** Name customers see; prints on receipts and shows in the app. */
  name: text('name').notNull(),
  orgId: text('org_id').notNull().unique(),
  /** Workspace subdomain: `<slug>.<root domain>`. Unique, DNS-safe. */
  slug: text('slug').notNull().unique(),
  businessType: businessTypeEnum('business_type').notNull(),

  // Profile (onboarding step 1)
  registeredName: text('registered_name'),
  registrationNumber: text('registration_number'),
  phone: text('phone'),
  country: text('country').notNull().default('LK'),
  addressLine: text('address_line'),
  city: text('city'),
  postalCode: text('postal_code'),

  // Tax and money (onboarding step 2)
  vatRegistered: boolean('vat_registered').notNull().default(false),
  vatNumber: text('vat_number'),
  currency: text('currency').notNull().default('LKR'),
  /** 'none' | 'nearest_1' | 'nearest_5' — how cash totals are rounded. */
  rounding: text('rounding').notNull().default('none'),

  /** Set when the owner finishes (or explicitly skips to the end of) onboarding. */
  onboardingCompletedAt: timestamp('onboarding_completed_at'),

  /** Last issued sale number; bumped atomically per sale (receipt numbering). */
  saleSeq: integer('sale_seq').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
