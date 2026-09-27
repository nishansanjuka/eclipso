import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AccessManagementUseCase } from '../access-management.use-case';
import { PermissionType } from '../../enums/auth-permissions.enum';
import { SystemRole } from '../../enums/auth-role.enum';

const ORG = 'biz_org';

function actor(perms: string[]) {
  return {
    userId: 'user_actor',
    orgId: ORG,
    businessId: 'biz-uuid',
    has: (p: string) => perms.includes(p),
    branchRestricted: false,
    canAccessBranch: () => true,
  } as any;
}

describe('AccessManagementUseCase', () => {
  let repo: Record<string, jest.Mock>;
  let access: { invalidateMember: jest.Mock; invalidateBusiness: jest.Mock };
  let business: Record<string, jest.Mock>;
  let useCase: AccessManagementUseCase;

  beforeEach(() => {
    repo = {
      withBusinessLock: jest.fn((_orgId: string, fn: (tx: unknown) => unknown) =>
        fn({}),
      ),
      findMembership: jest.fn(),
      setMemberBan: jest.fn().mockResolvedValue(undefined),
      listRoles: jest.fn().mockResolvedValue([]),
      createRole: jest.fn().mockResolvedValue('new-role-id'),
      protectedKeysWithin: jest.fn().mockResolvedValue(new Set()),
      listPermissionRows: jest.fn().mockResolvedValue([]),
      createRolePermissionRequest: jest.fn(),
    };
    access = {
      invalidateMember: jest.fn(),
      invalidateBusiness: jest.fn(),
    };
    business = {};
    useCase = new AccessManagementUseCase(
      repo as any,
      access as any,
      business as any,
      {} as any,
    );
  });

  describe('assignRole', () => {
    it('refuses to let an actor change their own role', async () => {
      await expect(
        useCase.assignRole(
          actor([PermissionType.ROLE_ASSIGN]),
          'user_actor',
          'role-id',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.withBusinessLock).not.toHaveBeenCalled();
    });
  });

  describe('banMember', () => {
    it('refuses to ban an owner', async () => {
      repo.findMembership.mockResolvedValue({
        roleKey: SystemRole.Owner,
        permissions: [PermissionType.MEMBER_MANAGE],
        restrictedBranchIds: null,
      });

      await expect(
        useCase.banMember(actor([PermissionType.MEMBER_MANAGE]), 'target'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.setMemberBan).not.toHaveBeenCalled();
    });

    it('bans a regular member', async () => {
      repo.findMembership.mockResolvedValue({
        roleKey: SystemRole.Member,
        permissions: [],
        restrictedBranchIds: null,
      });

      const result = await useCase.banMember(
        actor([PermissionType.MEMBER_MANAGE]),
        'target',
        'spamming',
      );
      expect(result).toEqual({ userId: 'target', isBanned: true });
      expect(repo.setMemberBan).toHaveBeenCalledWith(
        ORG,
        'target',
        { banned: true, bannedBy: 'user_actor', reason: 'spamming' },
        {},
      );
      expect(access.invalidateMember).toHaveBeenCalledWith(ORG, 'target');
    });

    it('404s on an unknown member', async () => {
      repo.findMembership.mockResolvedValue(null);
      await expect(
        useCase.banMember(actor([PermissionType.MEMBER_MANAGE]), 'nobody'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('createRole protected-permission split', () => {
    it('applies everything directly for a manage:protective-permissions holder', async () => {
      const permissions = [PermissionType.SALE_READ, PermissionType.ROLE_MANAGE];
      const result = await useCase.createRole(
        actor([...permissions, PermissionType.MANAGE_PROTECTIVE_PERMISSIONS]),
        { name: 'Cashier', permissions },
      );

      expect(repo.createRole).toHaveBeenCalledWith(
        expect.objectContaining({ permissions }),
        {},
      );
      expect(repo.createRolePermissionRequest).not.toHaveBeenCalled();
      expect(result.pendingRequest).toBeNull();
    });

    it('applies unprotected permissions now and queues protected ones as a request', async () => {
      repo.protectedKeysWithin.mockResolvedValue(
        new Set([PermissionType.ROLE_MANAGE]),
      );
      repo.listPermissionRows.mockResolvedValue([
        { id: 'perm-role-manage', key: PermissionType.ROLE_MANAGE },
        { id: 'perm-sale-read', key: PermissionType.SALE_READ },
      ]);
      repo.createRolePermissionRequest.mockResolvedValue({
        id: 'req-1',
        requestedPermissionIds: ['perm-role-manage'],
      });

      const permissions = [PermissionType.SALE_READ, PermissionType.ROLE_MANAGE];
      const result = await useCase.createRole(actor(permissions), {
        name: 'Cashier',
        permissions,
      });

      // Only the unprotected permission is applied to the role immediately.
      expect(repo.createRole).toHaveBeenCalledWith(
        expect.objectContaining({ permissions: [PermissionType.SALE_READ] }),
        {},
      );
      expect(repo.createRolePermissionRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          roleId: 'new-role-id',
          permissionIds: ['perm-role-manage'],
          requestedBy: 'user_actor',
        }),
        {},
      );
      expect(result.pendingRequest).not.toBeNull();
    });

    it('still refuses to grant a protected permission the actor does not hold at all', async () => {
      repo.protectedKeysWithin.mockResolvedValue(
        new Set([PermissionType.ROLE_MANAGE]),
      );

      await expect(
        useCase.createRole(actor([PermissionType.SALE_READ]), {
          name: 'Cashier',
          permissions: [PermissionType.SALE_READ, PermissionType.ROLE_MANAGE],
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.createRole).not.toHaveBeenCalled();
    });
  });
});
