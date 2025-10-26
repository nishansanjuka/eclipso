export enum PermissionType {
  CREATE_INVENTORY = 'permission:create_inventory',
  DELETE_INVENTORY = 'permission:delete_inventory',
  VIEW_REPORTS = 'permission:view_reports',
}

interface PermissionTypeMeta {
  label: string;
  description: string;
}

export const PermissionTypeMetaData: Record<
  PermissionType,
  PermissionTypeMeta
> = {
  [PermissionType.CREATE_INVENTORY]: {
    label: 'Create Inventory',
    description: 'Permission to create inventory items',
  },
  [PermissionType.DELETE_INVENTORY]: {
    label: 'Delete Inventory',
    description: 'Permission to delete inventory items',
  },
  [PermissionType.VIEW_REPORTS]: {
    label: 'View Reports',
    description: 'Permission to view reports',
  },
};
