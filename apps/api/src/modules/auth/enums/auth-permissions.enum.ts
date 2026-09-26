/**
 * Permission catalog. Code is the source of truth: `AccessBootstrapService`
 * upserts these keys into the `permissions` table on startup, so a permission
 * that is not listed here can never be granted or checked.
 *
 * Format: `<resource>:<action>`.
 */
export enum PermissionType {
  // Business & access management
  BUSINESS_MANAGE = 'business:manage',
  BUSINESS_DELETE = 'business:delete',
  MEMBER_READ = 'member:read',
  MEMBER_MANAGE = 'member:manage',
  ROLE_READ = 'role:read',
  ROLE_MANAGE = 'role:manage',
  ROLE_ASSIGN = 'role:assign',
  AUDIT_READ = 'audit:read',

  // Catalog
  PRODUCT_READ = 'product:read',
  PRODUCT_CREATE = 'product:create',
  PRODUCT_UPDATE = 'product:update',
  PRODUCT_DELETE = 'product:delete',
  CATEGORY_READ = 'category:read',
  CATEGORY_MANAGE = 'category:manage',
  BRAND_READ = 'brand:read',
  BRAND_MANAGE = 'brand:manage',
  SUPPLIER_READ = 'supplier:read',
  SUPPLIER_MANAGE = 'supplier:manage',
  TAX_READ = 'tax:read',
  TAX_MANAGE = 'tax:manage',
  DISCOUNT_READ = 'discount:read',
  DISCOUNT_MANAGE = 'discount:manage',

  // Inventory
  INVENTORY_READ = 'inventory:read',
  INVENTORY_ADJUST = 'inventory:adjust',

  // Sales
  CUSTOMER_READ = 'customer:read',
  CUSTOMER_MANAGE = 'customer:manage',
  ORDER_READ = 'order:read',
  ORDER_CREATE = 'order:create',
  ORDER_UPDATE = 'order:update',
  SALE_READ = 'sale:read',
  SALE_CREATE = 'sale:create',
  SALE_MANAGE = 'sale:manage',
  RETURN_READ = 'return:read',
  RETURN_CREATE = 'return:create',
  INVOICE_READ = 'invoice:read',
  INVOICE_MANAGE = 'invoice:manage',

  // Reporting
  REPORT_READ = 'report:read',
}

interface PermissionTypeMeta {
  label: string;
  description: string;
}

export const PermissionTypeMetaData: Record<
  PermissionType,
  PermissionTypeMeta
> = {
  [PermissionType.BUSINESS_MANAGE]: {
    label: 'Manage Business',
    description: 'Update business name and type',
  },
  [PermissionType.BUSINESS_DELETE]: {
    label: 'Delete Business',
    description: 'Permanently delete the business and all its data',
  },
  [PermissionType.MEMBER_READ]: {
    label: 'View Members',
    description: 'List members of the business',
  },
  [PermissionType.MEMBER_MANAGE]: {
    label: 'Manage Members',
    description: 'Remove members from the business',
  },
  [PermissionType.ROLE_READ]: {
    label: 'View Roles',
    description: 'List roles and their permissions',
  },
  [PermissionType.ROLE_MANAGE]: {
    label: 'Manage Roles',
    description: 'Create, edit and delete custom roles',
  },
  [PermissionType.ROLE_ASSIGN]: {
    label: 'Assign Roles',
    description: 'Change the role of a member',
  },
  [PermissionType.AUDIT_READ]: {
    label: 'View Audit Logs',
    description: 'Read audit logs',
  },
  [PermissionType.PRODUCT_READ]: {
    label: 'View Products',
    description: 'List and view products',
  },
  [PermissionType.PRODUCT_CREATE]: {
    label: 'Create Products',
    description: 'Create products',
  },
  [PermissionType.PRODUCT_UPDATE]: {
    label: 'Update Products',
    description: 'Edit products',
  },
  [PermissionType.PRODUCT_DELETE]: {
    label: 'Delete Products',
    description: 'Delete products',
  },
  [PermissionType.CATEGORY_READ]: {
    label: 'View Categories',
    description: 'List and view categories',
  },
  [PermissionType.CATEGORY_MANAGE]: {
    label: 'Manage Categories',
    description: 'Create, edit and delete categories',
  },
  [PermissionType.BRAND_READ]: {
    label: 'View Brands',
    description: 'List and view brands',
  },
  [PermissionType.BRAND_MANAGE]: {
    label: 'Manage Brands',
    description: 'Create, edit and delete brands',
  },
  [PermissionType.SUPPLIER_READ]: {
    label: 'View Suppliers',
    description: 'List and view suppliers',
  },
  [PermissionType.SUPPLIER_MANAGE]: {
    label: 'Manage Suppliers',
    description: 'Create, edit and delete suppliers',
  },
  [PermissionType.TAX_READ]: {
    label: 'View Taxes',
    description: 'List and view taxes',
  },
  [PermissionType.TAX_MANAGE]: {
    label: 'Manage Taxes',
    description: 'Create, edit and delete taxes',
  },
  [PermissionType.DISCOUNT_READ]: {
    label: 'View Discounts',
    description: 'List and view discounts',
  },
  [PermissionType.DISCOUNT_MANAGE]: {
    label: 'Manage Discounts',
    description: 'Create, edit and delete discounts',
  },
  [PermissionType.INVENTORY_READ]: {
    label: 'View Inventory',
    description: 'View inventory movements',
  },
  [PermissionType.INVENTORY_ADJUST]: {
    label: 'Adjust Inventory',
    description: 'Create stock adjustments',
  },
  [PermissionType.CUSTOMER_READ]: {
    label: 'View Customers',
    description: 'List and view customers',
  },
  [PermissionType.CUSTOMER_MANAGE]: {
    label: 'Manage Customers',
    description: 'Create, edit and delete customers',
  },
  [PermissionType.ORDER_READ]: {
    label: 'View Orders',
    description: 'List and view orders',
  },
  [PermissionType.ORDER_CREATE]: {
    label: 'Create Orders',
    description: 'Create orders',
  },
  [PermissionType.ORDER_UPDATE]: {
    label: 'Update Orders',
    description: 'Edit and cancel orders',
  },
  [PermissionType.SALE_READ]: {
    label: 'View Sales',
    description: 'List and view sales',
  },
  [PermissionType.SALE_CREATE]: {
    label: 'Create Sales',
    description: 'Ring up sales',
  },
  [PermissionType.SALE_MANAGE]: {
    label: 'Manage Sales',
    description: 'Edit and delete existing sales',
  },
  [PermissionType.RETURN_READ]: {
    label: 'View Returns',
    description: 'List and view returns',
  },
  [PermissionType.RETURN_CREATE]: {
    label: 'Create Returns',
    description: 'Process returns and refunds',
  },
  [PermissionType.INVOICE_READ]: {
    label: 'View Invoices',
    description: 'List and view invoices',
  },
  [PermissionType.INVOICE_MANAGE]: {
    label: 'Manage Invoices',
    description: 'Calculate and manage invoices',
  },
  [PermissionType.REPORT_READ]: {
    label: 'View Reports',
    description: 'View reports',
  },
};

export const ALL_PERMISSIONS: readonly PermissionType[] =
  Object.values(PermissionType);
