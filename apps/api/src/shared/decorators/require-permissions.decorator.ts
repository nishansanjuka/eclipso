import { SetMetadata } from '@nestjs/common';
import { PermissionType } from '../../modules/auth/enums/auth-permissions.enum';

export const PERMISSIONS_KEY = 'required_permissions';
export const ALLOW_WITHOUT_BUSINESS_KEY = 'allow_without_business';

export interface PermissionsMetadata {
  permissions: PermissionType[];
  /** `any` → holder needs at least one; `all` → holder needs every one. */
  mode: 'any' | 'all';
}

/**
 * Gates a route/controller behind business permissions stored in our DB. The
 * caller must hold AT LEAST ONE of the listed permissions in their current
 * business. Enforced by `PermissionsGuard`.
 *
 * @example
 * @RequirePermissions(PermissionType.PRODUCT_READ)
 * @Get()
 * list() { ... }
 */
export const RequirePermissions = (...permissions: PermissionType[]) =>
  SetMetadata(PERMISSIONS_KEY, {
    permissions,
    mode: 'any',
  } satisfies PermissionsMetadata);

/** Like {@link RequirePermissions} but the caller must hold EVERY permission. */
export const RequireAllPermissions = (...permissions: PermissionType[]) =>
  SetMetadata(PERMISSIONS_KEY, {
    permissions,
    mode: 'all',
  } satisfies PermissionsMetadata);

/**
 * Opts an authenticated route out of the default "must be acting inside a
 * business" rule, e.g. creating your first business or listing your own.
 */
export const AllowWithoutBusiness = () =>
  SetMetadata(ALLOW_WITHOUT_BUSINESS_KEY, true);
