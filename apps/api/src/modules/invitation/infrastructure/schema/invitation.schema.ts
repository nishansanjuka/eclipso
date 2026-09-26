import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { businesses } from '../../../business/infrastructure/schema/business.schema';
import { roles } from '../../../auth/infrastructure/schema/access.schema';
import { users } from '../../../users/infrastructure/schema/user.schema';

export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'revoked',
]);

/**
 * An offer to join a business with a given role (and optionally only some
 * branches). Only a SHA-256 of the link token is stored, so a database leak
 * cannot be turned into working invitation links. "Expired" is derived from
 * `expiresAt`, never stored.
 */
export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    /** Lower-cased. The invitee must sign up / in with this verified email. */
    email: text('email').notNull(),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    /** Empty = every branch; otherwise the member is limited to these. */
    branchIds: uuid('branch_ids')
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    tokenHash: text('token_hash').notNull().unique(),
    status: invitationStatusEnum('status').notNull().default('pending'),
    invitedBy: text('invited_by').references(() => users.clerkId, {
      onDelete: 'set null',
    }),
    expiresAt: timestamp('expires_at').notNull(),
    lastSentAt: timestamp('last_sent_at'),
    sendCount: integer('send_count').notNull().default(0),
    acceptedAt: timestamp('accepted_at'),
    acceptedBy: text('accepted_by'),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    // One live invitation per email per business; re-inviting resends it.
    uniqueIndex('invitations_pending_email_uq')
      .on(t.businessId, t.email)
      .where(sql`${t.status} = 'pending'`),
    index('invitations_business_idx').on(t.businessId, t.status),
  ],
);
