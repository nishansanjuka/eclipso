import { text, timestamp } from 'drizzle-orm/pg-core';
import { pgTable, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().unique().notNull(),
  clerkId: text('clerk_id').notNull().unique(),
  name: text('name').notNull(),
  /** Clerk's profile image URL; kept in sync via the user.created/updated webhooks. */
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
