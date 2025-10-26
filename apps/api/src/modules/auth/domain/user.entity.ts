import { UserPermissions, UserRole } from '../../../types/auth';

export class AuthUserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly role: UserRole,
    public readonly permissions: UserPermissions[],
    public readonly isActive: boolean,
  ) {}

  isAdmin(): boolean {
    return this.role === 'org:admin';
  }

  getPermissions(): UserPermissions[] {
    return this.permissions;
  }
}
