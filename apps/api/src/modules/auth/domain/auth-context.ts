import { PermissionType } from '../enums/auth-permissions.enum';

export interface AuthContextInit {
  userId: string;
  orgId?: string;
  businessId?: string;
  roleId?: string;
  roleKey?: string;
  permissions?: Iterable<string>;
  /** Branch the request operates in (resolved from X-Branch-Id / defaults). */
  branchId?: string;
  /**
   * Branches this member is restricted to (any status, for reading history).
   * Omitted or null = not restricted: every branch of the business.
   */
  restrictedBranchIds?: Iterable<string> | null;
}

/** What use cases need to know about who may see which branch's data. */
export interface BranchScope {
  /** True when the caller may read or act on data belonging to this branch. */
  canAccessBranch(branchId: string): boolean;
}

/**
 * Per-request identity + authorization state, attached to `req.user` by
 * `AuthMiddleware`. `userId` is the (Clerk-verified) identity; everything else
 * comes from our own DB.
 *
 * Immutable: the permission set is frozen at construction so no handler can
 * widen it mid-request.
 */
export class AuthContext implements BranchScope {
  /** Verified user identity (Clerk user id). */
  readonly userId: string;
  /** Business the request is scoped to. Undefined until one is resolved. */
  readonly orgId?: string;
  /** Internal uuid of the business (`businesses.id`), for tables keyed by it. */
  readonly businessId?: string;
  readonly roleId?: string;
  readonly roleKey?: string;
  /** Branch the request is scoped to; undefined if none could be resolved. */
  readonly branchId?: string;
  private readonly granted: ReadonlySet<string>;
  private readonly restricted: ReadonlySet<string> | null;

  constructor(init: AuthContextInit) {
    this.userId = init.userId;
    this.orgId = init.orgId;
    this.businessId = init.businessId;
    this.roleId = init.roleId;
    this.roleKey = init.roleKey;
    this.branchId = init.branchId;
    this.granted = new Set(init.permissions ?? []);
    this.restricted = init.restrictedBranchIds
      ? new Set(init.restrictedBranchIds)
      : null;
    Object.freeze(this);
  }

  get permissions(): readonly string[] {
    return [...this.granted];
  }

  /** True when the member may only work in specific branches. */
  get branchRestricted(): boolean {
    return this.restricted !== null;
  }

  /** The branches a restricted member is limited to; null when unrestricted. */
  get restrictedBranchIds(): readonly string[] | null {
    return this.restricted ? [...this.restricted] : null;
  }

  canAccessBranch(branchId: string): boolean {
    return this.restricted === null || this.restricted.has(branchId);
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
