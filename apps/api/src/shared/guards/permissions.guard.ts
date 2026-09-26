import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as express from 'express';
import { AuthContext } from '../../modules/auth/domain/auth-context';
import {
  ALLOW_WITHOUT_BUSINESS_KEY,
  PERMISSIONS_KEY,
  PermissionsMetadata,
} from '../decorators/require-permissions.decorator';

/**
 * Registered globally. Behaviour, in order:
 *
 *  1. No `AuthContext` on the request (route isn't behind `AuthMiddleware`):
 *     pass, unless the route demands permissions — then deny (fail closed).
 *  2. Authenticated route: the caller must be acting inside a business
 *     (a DB-verified membership) unless `@AllowWithoutBusiness()`.
 *  3. `@RequirePermissions()` / `@RequireAllPermissions()` are checked against
 *     the permissions loaded from the DB for that membership.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    const meta = this.reflector.getAllAndOverride<
      PermissionsMetadata | undefined
    >(PERMISSIONS_KEY, targets);
    const allowWithoutBusiness =
      this.reflector.getAllAndOverride<boolean | undefined>(
        ALLOW_WITHOUT_BUSINESS_KEY,
        targets,
      ) === true;

    const req = context.switchToHttp().getRequest<express.Request>();
    const auth = req.user as unknown;

    if (!(auth instanceof AuthContext)) {
      if (meta && meta.permissions.length > 0) {
        throw new ForbiddenException('Missing authorization context.');
      }
      return true;
    }

    if (!auth.hasBusiness && !allowWithoutBusiness) {
      throw new ForbiddenException(
        'No business selected. Create a business or send the X-Business-Id header.',
      );
    }

    if (!meta || meta.permissions.length === 0) return true;

    const granted =
      meta.mode === 'all'
        ? auth.hasAll(meta.permissions)
        : auth.hasAny(meta.permissions);

    if (!granted) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }
    return true;
  }
}
