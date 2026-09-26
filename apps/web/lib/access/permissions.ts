/**
 * Mirror of the API permission catalog (`PermissionType` in
 * apps/api/src/modules/auth/enums/auth-permissions.enum.ts).
 *
 * The API is the source of truth and enforces every key server-side; this copy
 * only drives what the UI shows. Keep the two in sync.
 */
export const PERMISSIONS = {
  BUSINESS_MANAGE: "business:manage",
  BUSINESS_DELETE: "business:delete",
  BRANCH_READ: "branch:read",
  BRANCH_MANAGE: "branch:manage",
  MEMBER_READ: "member:read",
  MEMBER_MANAGE: "member:manage",
  ROLE_READ: "role:read",
  ROLE_MANAGE: "role:manage",
  ROLE_ASSIGN: "role:assign",
  AUDIT_READ: "audit:read",

  PRODUCT_READ: "product:read",
  PRODUCT_CREATE: "product:create",
  PRODUCT_UPDATE: "product:update",
  PRODUCT_DELETE: "product:delete",
  CATEGORY_READ: "category:read",
  CATEGORY_MANAGE: "category:manage",
  BRAND_READ: "brand:read",
  BRAND_MANAGE: "brand:manage",
  SUPPLIER_READ: "supplier:read",
  SUPPLIER_MANAGE: "supplier:manage",
  TAX_READ: "tax:read",
  TAX_MANAGE: "tax:manage",
  DISCOUNT_READ: "discount:read",
  DISCOUNT_MANAGE: "discount:manage",

  INVENTORY_READ: "inventory:read",
  INVENTORY_ADJUST: "inventory:adjust",

  CUSTOMER_READ: "customer:read",
  CUSTOMER_MANAGE: "customer:manage",
  ORDER_READ: "order:read",
  ORDER_CREATE: "order:create",
  ORDER_UPDATE: "order:update",
  SALE_READ: "sale:read",
  SALE_CREATE: "sale:create",
  SALE_MANAGE: "sale:manage",
  RETURN_READ: "return:read",
  RETURN_CREATE: "return:create",
  INVOICE_READ: "invoice:read",
  INVOICE_MANAGE: "invoice:manage",

  REPORT_READ: "report:read",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
