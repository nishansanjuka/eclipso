import { ForbiddenException } from '@nestjs/common';
import { AccessService } from '../access.service';
import { MembershipRecord } from '../access.repository';

jest.mock('../../../../shared/config', () => ({
  loadConfig: () => ({ ACCESS_CACHE_TTL_MS: 0 }),
}));

const MAIN = '11111111-1111-4111-8111-111111111111';
const KOTTAWA = '22222222-2222-4222-8222-222222222222';
const MAHARAGAMA = '33333333-3333-4333-8333-333333333333';

function membership(overrides: Partial<MembershipRecord> = {}) {
  return {
    userId: 'user_1',
    orgId: 'biz_1',
    businessId: 'business-uuid',
    roleId: 'role-1',
    roleKey: 'member',
    permissions: [],
    restrictedBranchIds: null,
    operableBranches: [
      { id: MAIN, isDefault: true },
      { id: KOTTAWA, isDefault: false },
      { id: MAHARAGAMA, isDefault: false },
    ],
    ...overrides,
  } as MembershipRecord;
}

function serviceFor(record: MembershipRecord | null) {
  const repository = {
    findMembership: jest.fn().mockResolvedValue(record),
    listMembershipOrgIds: jest.fn().mockResolvedValue(['biz_1']),
    orgIdBySlug: jest.fn((slug: string) =>
      Promise.resolve(slug === 'keels' ? 'biz_1' : undefined),
    ),
  };
  return new AccessService(repository as never);
}

describe('AccessService branch resolution', () => {
  it('uses the default branch when no branch is requested', async () => {
    const ctx = await serviceFor(membership()).resolve('user_1', 'biz_1');
    expect(ctx.branchId).toBe(MAIN);
    expect(ctx.branchRestricted).toBe(false);
  });

  it('honours a requested branch the member may operate in', async () => {
    const ctx = await serviceFor(membership()).resolve(
      'user_1',
      'biz_1',
      KOTTAWA,
    );
    expect(ctx.branchId).toBe(KOTTAWA);
  });

  it('rejects a branch that is unknown, inactive or off-limits alike', async () => {
    await expect(
      serviceFor(membership()).resolve(
        'user_1',
        'biz_1',
        '99999999-9999-4999-8999-999999999999',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('limits a restricted member to their branches', async () => {
    const restricted = membership({
      restrictedBranchIds: [KOTTAWA],
      operableBranches: [{ id: KOTTAWA, isDefault: false }],
    });

    const ctx = await serviceFor(restricted).resolve('user_1', 'biz_1');
    // Default branch is not theirs: falls back to their only branch.
    expect(ctx.branchId).toBe(KOTTAWA);
    expect(ctx.branchRestricted).toBe(true);
    expect(ctx.canAccessBranch(KOTTAWA)).toBe(true);
    expect(ctx.canAccessBranch(MAIN)).toBe(false);

    await expect(
      serviceFor(restricted).resolve('user_1', 'biz_1', MAIN),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('leaves the branch unset when a restricted member has several and none is the default', async () => {
    const restricted = membership({
      restrictedBranchIds: [KOTTAWA, MAHARAGAMA],
      operableBranches: [
        { id: KOTTAWA, isDefault: false },
        { id: MAHARAGAMA, isDefault: false },
      ],
    });
    const ctx = await serviceFor(restricted).resolve('user_1', 'biz_1');
    expect(ctx.branchId).toBeUndefined();
  });

  it("never widens access when all of a restricted member's branches are inactive", async () => {
    const restricted = membership({
      restrictedBranchIds: [KOTTAWA],
      operableBranches: [],
    });
    const ctx = await serviceFor(restricted).resolve('user_1', 'biz_1');
    expect(ctx.branchId).toBeUndefined();
    expect(ctx.branchRestricted).toBe(true);
    expect(ctx.canAccessBranch(MAIN)).toBe(false);
  });

  describe('workspace address (X-Business-Slug)', () => {
    it('resolves the business from the subdomain slug', async () => {
      const ctx = await serviceFor(membership()).resolve(
        'user_1',
        undefined,
        undefined,
        'keels',
      );
      expect(ctx.orgId).toBe('biz_1');
      expect(ctx.branchId).toBe(MAIN);
    });

    it('unknown slug and non-member get the same 403', async () => {
      await expect(
        serviceFor(membership()).resolve(
          'user_1',
          undefined,
          undefined,
          'nope',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        serviceFor(null).resolve('user_1', undefined, undefined, 'keels'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('refuses both an id and a slug', async () => {
      await expect(
        serviceFor(membership()).resolve('user_1', 'biz_1', undefined, 'keels'),
      ).rejects.toThrow(/not both/);
    });
  });

  it('refuses a banned member with a distinct, machine-readable code', async () => {
    const banned = membership({ isBanned: true });
    await expect(
      serviceFor(banned).resolve('user_1', 'biz_1'),
    ).rejects.toMatchObject({
      response: { code: 'MEMBERSHIP_BANNED' },
    });
  });

  it('a user in several businesses with no header gets a business-less context', async () => {
    const repository = {
      findMembership: jest.fn(),
      listMembershipOrgIds: jest.fn().mockResolvedValue(['a', 'b']),
    };
    const ctx = await new AccessService(repository as never).resolve('user_1');
    expect(ctx.hasBusiness).toBe(false);
    expect(repository.findMembership).not.toHaveBeenCalled();
  });
});
