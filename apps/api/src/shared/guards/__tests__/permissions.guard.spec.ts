import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthContext } from '../../../modules/auth/domain/auth-context';
import { PermissionType } from '../../../modules/auth/enums/auth-permissions.enum';
import {
  ALLOW_WITHOUT_BUSINESS_KEY,
  PERMISSIONS_KEY,
} from '../../decorators/require-permissions.decorator';
import { PermissionsGuard } from '../permissions.guard';

const P = PermissionType;

function run(user: unknown, metadata: Record<string, unknown>): boolean {
  const reflector = {
    getAllAndOverride: (key: string) => metadata[key],
  } as unknown as Reflector;
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
  return new PermissionsGuard(reflector).canActivate(context);
}

const member = new AuthContext({
  userId: 'user_1',
  orgId: 'biz_1',
  permissions: [P.PRODUCT_READ, P.SALE_CREATE],
});

describe('PermissionsGuard', () => {
  it('lets unauthenticated routes without metadata through', () => {
    expect(run(undefined, {})).toBe(true);
  });

  it('fails closed when permissions are required but there is no context', () => {
    expect(() =>
      run(undefined, {
        [PERMISSIONS_KEY]: { permissions: [P.PRODUCT_READ], mode: 'any' },
      }),
    ).toThrow(ForbiddenException);
  });

  it('rejects an authenticated caller who has no business', () => {
    expect(() => run(new AuthContext({ userId: 'user_1' }), {})).toThrow(
      ForbiddenException,
    );
  });

  it('allows a business-less caller on @AllowWithoutBusiness routes', () => {
    expect(
      run(new AuthContext({ userId: 'user_1' }), {
        [ALLOW_WITHOUT_BUSINESS_KEY]: true,
      }),
    ).toBe(true);
  });

  it('any-mode needs one permission', () => {
    const meta = {
      [PERMISSIONS_KEY]: {
        permissions: [P.PRODUCT_DELETE, P.PRODUCT_READ],
        mode: 'any',
      },
    };
    expect(run(member, meta)).toBe(true);
  });

  it('all-mode needs every permission', () => {
    const meta = {
      [PERMISSIONS_KEY]: {
        permissions: [P.PRODUCT_READ, P.PRODUCT_DELETE],
        mode: 'all',
      },
    };
    expect(() => run(member, meta)).toThrow(ForbiddenException);
  });

  it('denies when the permission is missing', () => {
    expect(() =>
      run(member, {
        [PERMISSIONS_KEY]: { permissions: [P.BUSINESS_DELETE], mode: 'any' },
      }),
    ).toThrow(ForbiddenException);
  });

  it('ignores a forged plain object posing as a context', () => {
    const forged = { userId: 'x', orgId: 'biz_1', hasBusiness: true };
    expect(() =>
      run(forged, {
        [PERMISSIONS_KEY]: { permissions: [P.PRODUCT_READ], mode: 'any' },
      }),
    ).toThrow(ForbiddenException);
  });
});
