export enum UserRole {
  Admin = 'org:admin',
  Member = 'org:member',
}

interface UserRoleMeta {
  label: string;
  description: string;
}

export const UserRoleMetaData: Record<UserRole, UserRoleMeta> = {
  [UserRole.Admin]: { label: 'Administrator', description: 'Full access' },
  [UserRole.Member]: { label: 'Member', description: 'Basic user' },
};
