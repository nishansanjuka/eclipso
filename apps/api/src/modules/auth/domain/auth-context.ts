import { PermissionType } from '../enums/auth-permissions.enum';

export interface AuthContextInit {
  userId: string;
  orgId?: string;
  businessId?: string;
  roleId?: string;
  roleKey?: string;
  permissions?: Iterable<string>;
}

/**
 * Per-request identity + authorization state, attached to `req.user` by
 * `AuthMiddleware`. `userId` is the (Clerk-verified) identity; everything else
 * comes from our own DB.
 *
 * Immutable: the permission set is frozen at construction so no handler can
 * widen it mid-request.
 */
export class AuthContext {
  /** Verified user identity (Clerk user id). */
  readonly userId: string;
  /** Business the request is scoped to. Undefined until one is resolved. */
  readonly orgId?: string;
  /** Internal uuid of the business (`businesses.id`), for tables keyed by it. */
  readonly businessId?: string;
  readonly roleId?: string;
  readonly roleKey?: string;
  private readonly granted: ReadonlySet<string>;

  constructor(init: AuthContextInit) {
    this.userId = init.userId;
    this.orgId = init.orgId;
    this.businessId = init.businessId;
    this.roleId = init.roleId;
    this.roleKey = init.roleKey;
    this.granted = new Set(init.permissions ?? []);
    Object.freeze(this);
  }

  get permissions(): readonly string[] {
    return [...this.granted];
  }

  get hasBusiness(): boolean {
    return this.orgId !== undefined;
  }

  has(permission: PermissionType): boolean {
    return this.granted.has(permission);
  }

  hasAny(permissions: readonly PermissionType[]): boolean {
    return permissions.some((p) => this.granted.has(p));
  }

  hasAll(permissions: readonly PermissionType[]): boolean {
    return permissions.every((p) => this.granted.has(p));
  }
}
