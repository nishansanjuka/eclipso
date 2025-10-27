import { PermissionType } from '../enums/auth-permissions.enum';
import { UserRole } from '../enums/auth-role.enum';

export class AuthUserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly role: UserRole,
    public readonly permissions: PermissionType[],
    public readonly isActive: boolean,
  ) {}

  isAdmin(): boolean {
    return this.role === UserRole.Admin;
  }

  getPermissions(): PermissionType[] {
    return this.permissions;
  }
}
