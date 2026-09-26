import { ALL_PERMISSIONS, PermissionType } from './auth-permissions.enum';

/**
 * Built-in roles, shared by every business. Their permission sets live in code
 * and are re-synced to the DB on startup, so they cannot be edited or deleted
 * at runtime. Businesses add their own roles on top (see `roles.businessId`).
 */
export enum SystemRole {
  Owner = 'owner',
  Admin = 'admin',
  Member = 'member',
}

interface SystemRoleMeta {
  label: string;
  description: string;
  permissions: readonly PermissionType[];
}

const P = PermissionType;

export const SystemRoleMetaData: Record<SystemRole, SystemRoleMeta> = {
  [SystemRole.Owner]: {
    label: 'Owner',
    description: 'Full access, including deleting the business',
    permissions: ALL_PERMISSIONS,
  },
  [SystemRole.Admin]: {
    label: 'Administrator',
    description: 'Full access except deleting the business',
    permissions: ALL_PERMISSIONS.filter((p) => p !== P.BUSINESS_DELETE),
  },
  [SystemRole.Member]: {
    label: 'Member',
    description: 'Day-to-day point-of-sale access',
    permissions: [
      P.PRODUCT_READ,
      P.CATEGORY_READ,
      P.BRAND_READ,
      P.SUPPLIER_READ,
      P.TAX_READ,
      P.DISCOUNT_READ,
      P.INVENTORY_READ,
      P.CUSTOMER_READ,
      P.CUSTOMER_MANAGE,
      P.ORDER_READ,
      P.ORDER_CREATE,
      P.SALE_READ,
      P.SALE_CREATE,
      P.RETURN_READ,
      P.RETURN_CREATE,
      P.INVOICE_READ,
    ],
  },
};
