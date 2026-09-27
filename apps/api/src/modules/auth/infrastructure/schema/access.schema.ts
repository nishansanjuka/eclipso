import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { businesses } from '../../../business/infrastructure/schema/business.schema';
import { users } from '../../../users/infrastructure/schema/user.schema';

/**
 * Mirror of the `PermissionType` catalog; synced from code on startup.
 * Whether a permission is protected is NOT stored here — that's per-business,
 * see `businessProtectedPermissions` below.
 */
export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  label: text('label').notNull(),
  description: text('description').notNull(),
});

/**
 * Which permissions a given business has labeled protected. Presence of a
 * row = protected for that business; absence = unprotected. Any holder of
 * that business's `manage:protective-permissions` can add/remove rows here.
 */
export const businessProtectedPermissions = pgTable(
  'business_protected_permissions',
  {
    businessId: text('business_id')
      .notNull()
      .references(() => businesses.orgId, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.businessId, t.permissionId] }),
    index('business_protected_permissions_permission_idx').on(
      t.permissionId,
    ),
  ],
);

/**
 * `businessId` null → built-in role shared by all businesses (`isSystem`).
 * `businessId` set  → custom role owned by exactly one business.
 */
export const roles = pgTable(
  'roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: text('business_id').references(() => businesses.orgId, {
      onDelete: 'cascade',
    }),
    key: text('key').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    // NULLs are distinct in a plain unique index, so system and custom roles
    // each get their own partial index.
    uniqueIndex('roles_system_key_uq')
      .on(t.key)
      .where(sql`${t.businessId} is null`),
    uniqueIndex('roles_business_key_uq')
      .on(t.businessId, t.key)
      .where(sql`${t.businessId} is not null`),
  ],
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.roleId, t.permissionId] }),
    index('role_permissions_permission_idx').on(t.permissionId),
  ],
);

export const rolePermissionRequestStatusEnum = pgEnum(
  'role_permission_request_status',
  ['pending', 'approved', 'rejected'],
);

/**
 * A pending ask to add protected permissions to a role. Created when a
 * `role:manage` holder who lacks `manage:protective-permissions` includes a
 * protected permission on a create/update — only that subset lands here, the
 * unprotected ones are applied immediately. Only custom roles ever have one of
 * these (built-in roles are immutable, see `requireCustomRole`).
 */
export const rolePermissionRequests = pgTable(
  'role_permission_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    requestedPermissionIds: uuid('requested_permission_ids')
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    requestedBy: text('requested_by')
      .notNull()
      .references(() => users.clerkId, { onDelete: 'cascade' }),
    status: rolePermissionRequestStatusEnum('status')
      .notNull()
      .default('pending'),
    reviewedBy: text('reviewed_by').references(() => users.clerkId, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('role_permission_requests_role_idx').on(t.roleId, t.status)],
);
