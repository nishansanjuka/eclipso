export type UserPermissions =
  | 'permission:create_inventory'
  | 'permission:delete_inventory'
  | 'permission:view_reports';
export type OwnerPublicMetadata = {
  businessName: string;
};

export const UserRoleObject = {
  ORG_ADMIN: 'org:admin',
  ORG_MEMBER: 'org:member',
} as const;

export const BusinessTypeObject = {
  RETAIL: 'retail',
  SERVICE: 'service',
  MANUFACTURING: 'manufacturing',
} as const;

export type BusinessType =
  (typeof BusinessTypeObject)[keyof typeof BusinessTypeObject];
export type UserRole = (typeof UserRoleObject)[keyof typeof UserRoleObject];
export type BusinessPublicMetadata = {
  businessType: BusinessType;
};
