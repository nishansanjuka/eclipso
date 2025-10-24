export type UserRole = 'org:admin' | 'org:member';
export type UserPermissions =
  | 'permission:create_inventory'
  | 'permission:delete_inventory'
  | 'permission:view_reports';
export type OwnerPublicMetadata = {
  businessName: string;
};

export const BusinessTypeObject = {
  RETAIL: 'retail',
  SERVICE: 'service',
  MANUFACTURING: 'manufacturing',
} as const;

export type BusinessType =
  (typeof BusinessTypeObject)[keyof typeof BusinessTypeObject];
export type BusinessPublicMetadata = {
  businessType: BusinessType;
};
