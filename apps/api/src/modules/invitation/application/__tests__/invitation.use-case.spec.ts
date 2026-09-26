import {
  ConflictException,
  ForbiddenException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';
import { InvitationUseCase } from '../invitation.use-case';
import {
  hashInvitationToken,
  newInvitationToken,
} from '../../domain/invitation-token';

jest.mock('../../../../shared/config', () => ({
  loadConfig: () => ({
    INVITATION_TTL_DAYS: 7,
    WEB_PROTOCOL: 'https',
    WEB_ROOT_DOMAIN: 'aperture.test',
  }),
}));

const BIZ = 'biz-uuid';
const ORG = 'biz_org';
const ROLE_CASHIER = 'role-cashier';
const KOT = '22222222-2222-4222-8222-222222222222';
const MAIN = '11111111-1111-4111-8111-111111111111';

const cashierRole = {
  id: ROLE_CASHIER,
  businessId: null,
  name: 'Member',
  permissions: ['sale:create', 'sale:read'],
};
const ownerRole = {
  id: 'role-owner',
  businessId: null,
  name: 'Owner',
  permissions: ['sale:create', 'business:delete'],
};

function actor(
  overrides: Partial<{
    perms: string[];
    restricted: string[] | null;
  }> = {},
) {
  const perms = overrides.perms ?? [
    'sale:create',
    'sale:read',
    'member:manage',
  ];
  const restricted = overrides.restricted ?? null;
  return {
    userId: 'user_owner',
    orgId: ORG,
    businessId: BIZ,
    has: (p: string) => perms.includes(p),
    branchRestricted: restricted !== null,
    canAccessBranch: (id: string) =>
      restricted === null || restricted.includes(id),
  } as any;
}

describe('InvitationUseCase', () => {
  let repo: Record<string, jest.Mock>;
  let access: Record<string, jest.Mock>;
  let accessService: { invalidateMember: jest.Mock };
  let business: { getProfile: jest.Mock };
  let mail: { send: jest.Mock };
  let identity: { get: jest.Mock };
  let useCase: InvitationUseCase;

  beforeEach(() => {
    repo = {
      transaction: jest.fn((fn: (tx: unknown) => unknown) => fn('tx')),
      lockPendingByEmail: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn((_tx, v) =>
        Promise.resolve({
          id: 'inv-1',
          email: v.email,
          roleId: v.roleId,
          branchIds: v.branchIds,
          expiresAt: v.expiresAt,
        }),
      ),
      update: jest.fn((_tx, id, v) =>
        Promise.resolve({
          id,
          email: 'a@x.lk',
          roleId: ROLE_CASHIER,
          branchIds: [],
          expiresAt: new Date(Date.now() + 1e6),
          ...v,
        }),
      ),
      lockById: jest.fn(),
      lockByTokenHash: jest.fn(),
      branchNames: jest.fn().mockResolvedValue([]),
      markSent: jest.fn(),
      list: jest.fn().mockResolvedValue([]),
      businessOf: jest.fn().mockResolvedValue({
        id: BIZ,
        orgId: ORG,
        name: 'Aperture Retail',
        slug: 'aperture-retail',
      }),
      ensureUser: jest.fn(),
      isMember: jest.fn().mockResolvedValue(false),
      addMember: jest.fn(),
      lookupContext: jest.fn(),
    };
    access = {
      findRole: jest.fn().mockResolvedValue(cashierRole),
      branchIdsInBusiness: jest.fn((_b, ids: string[]) => Promise.resolve(ids)),
    };
    accessService = { invalidateMember: jest.fn() };
    business = {
      getProfile: jest.fn().mockResolvedValue({
        name: 'Aperture Retail',
        slug: 'aperture-retail',
      }),
    };
    mail = { send: jest.fn().mockResolvedValue({ sent: true }) };
    identity = {
      get: jest.fn().mockResolvedValue({
        userId: 'u',
        name: 'Nadeesha',
        verifiedEmails: ['ishara@apertureretail.lk'],
      }),
    };
    useCase = new InvitationUseCase(
      repo as any,
      access as any,
      accessService as any,
      business as any,
      mail as any,
      identity as any,
    );
  });

  describe('create', () => {
    const req = { email: 'ishara@apertureretail.lk', roleId: ROLE_CASHIER };

    it('stores only a hash of the token and emails a link on the workspace domain', async () => {
      const { results } = await useCase.create(actor(), [req]);

      const stored = repo.insert.mock.calls[0][1];
      expect(stored.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      const sent = mail.send.mock.calls[0][0];
      expect(sent.to).toBe('ishara@apertureretail.lk');
      const token = /invite\/([A-Za-z0-9_-]{43})/.exec(sent.html)![1];
      expect(hashInvitationToken(token)).toBe(stored.tokenHash);
      expect(sent.html).toContain(
        'https://aperture-retail.aperture.test/invite/',
      );
      expect(sent.subject).toContain('Aperture Retail');

      expect(results[0]).toMatchObject({ ok: true, emailSent: true });
      expect(repo.markSent).toHaveBeenCalledWith('inv-1');
    });

    it('still succeeds when the email cannot be sent, handing back the link', async () => {
      mail.send.mockResolvedValue({ sent: false, reason: 'no key' });
      const { results } = await useCase.create(actor(), [req]);

      expect(results[0]).toMatchObject({
        ok: true,
        emailSent: false,
        emailError: 'no key',
      });
      expect((results[0] as any).inviteUrl).toContain('/invite/');
      expect(repo.markSent).not.toHaveBeenCalled();
    });

    it('cannot invite into a role with permissions the inviter lacks', async () => {
      access.findRole.mockResolvedValue(ownerRole);
      const { results } = await useCase.create(actor(), [
        { ...req, roleId: 'role-owner' },
      ]);

      expect(results[0]).toMatchObject({ ok: false });
      expect((results[0] as any).error).toMatch(/business:delete/);
      expect(repo.insert).not.toHaveBeenCalled();
      expect(mail.send).not.toHaveBeenCalled();
    });

    it("cannot use another business's custom role", async () => {
      access.findRole.mockResolvedValue({
        ...cashierRole,
        businessId: 'someone_else',
      });
      const { results } = await useCase.create(actor(), [req]);
      expect((results[0] as any).error).toMatch(/Role not found/);
    });

    it('a branch-limited inviter must name branches inside their own', async () => {
      const limited = actor({ restricted: [KOT] });

      let r = (await useCase.create(limited, [req])).results[0] as any;
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/limited to specific branches/);

      r = (await useCase.create(limited, [{ ...req, branchIds: [MAIN] }]))
        .results[0] as any;
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/cannot invite people into branches/);

      r = (await useCase.create(limited, [{ ...req, branchIds: [KOT] }]))
        .results[0] as any;
      expect(r.ok).toBe(true);
      expect(repo.insert.mock.calls[0][1].branchIds).toEqual([KOT]);
    });

    it('rejects branches that are not in the business', async () => {
      access.branchIdsInBusiness.mockResolvedValue([]);
      const r = (await useCase.create(actor(), [{ ...req, branchIds: [KOT] }]))
        .results[0] as any;
      expect(r.error).toMatch(/Branch not found/);
    });

    it('re-issues a pending invitation for the same email instead of duplicating it', async () => {
      repo.lockPendingByEmail.mockResolvedValue({
        id: 'inv-old',
        branchIds: [],
      });
      await useCase.create(actor(), [req]);

      expect(repo.insert).not.toHaveBeenCalled();
      expect(repo.update).toHaveBeenCalledWith(
        'tx',
        'inv-old',
        expect.objectContaining({ tokenHash: expect.any(String) }),
      );
    });

    it('one bad row does not stop the others', async () => {
      access.findRole
        .mockResolvedValueOnce(ownerRole)
        .mockResolvedValue(cashierRole);
      const { results } = await useCase.create(actor(), [
        { email: 'a@x.lk', roleId: 'role-owner' },
        { email: 'b@x.lk', roleId: ROLE_CASHIER },
      ]);
      expect(results.map((r) => r.ok)).toEqual([false, true]);
    });
  });

  describe('resend', () => {
    it('replaces the token (old link stops working) and extends the expiry', async () => {
      const old = hashInvitationToken(newInvitationToken());
      repo.lockById.mockResolvedValue({
        id: 'inv-1',
        status: 'pending',
        roleId: ROLE_CASHIER,
        branchIds: [],
        tokenHash: old,
      });

      await useCase.resend(actor(), 'inv-1');

      const set = repo.update.mock.calls[0][2];
      expect(set.tokenHash).not.toBe(old);
      expect(set.expiresAt.getTime()).toBeGreaterThan(
        Date.now() + 6 * 86_400_000,
      );
      expect(mail.send).toHaveBeenCalled();
    });

    it('cannot resend an accepted or revoked invitation, or one that is not yours', async () => {
      repo.lockById.mockResolvedValue({
        id: 'i',
        status: 'accepted',
        branchIds: [],
      });
      await expect(useCase.resend(actor(), 'i')).rejects.toThrow(
        ConflictException,
      );
      repo.lockById.mockResolvedValue({
        id: 'i',
        status: 'revoked',
        branchIds: [],
      });
      await expect(useCase.resend(actor(), 'i')).rejects.toThrow(
        ConflictException,
      );
      repo.lockById.mockResolvedValue(undefined);
      await expect(useCase.resend(actor(), 'i')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('a branch-limited member cannot touch an all-branch invitation', async () => {
      repo.lockById.mockResolvedValue({
        id: 'i',
        status: 'pending',
        branchIds: [],
        roleId: ROLE_CASHIER,
      });
      await expect(
        useCase.resend(actor({ restricted: [KOT] }), 'i'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        useCase.revoke(actor({ restricted: [KOT] }), 'i'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('revoke', () => {
    it('marks a pending invitation revoked and is idempotent', async () => {
      repo.lockById.mockResolvedValue({
        id: 'i',
        status: 'pending',
        branchIds: [],
      });
      await useCase.revoke(actor(), 'i');
      expect(repo.update).toHaveBeenCalledWith(
        'tx',
        'i',
        expect.objectContaining({ status: 'revoked' }),
      );

      repo.update.mockClear();
      repo.lockById.mockResolvedValue({
        id: 'i',
        status: 'revoked',
        branchIds: [],
      });
      await useCase.revoke(actor(), 'i');
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('an accepted invitation must be removed as a member instead', async () => {
      repo.lockById.mockResolvedValue({
        id: 'i',
        status: 'accepted',
        branchIds: [],
      });
      await expect(useCase.revoke(actor(), 'i')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('list', () => {
    it('derives "expired" and hides all-branch invitations from limited members', async () => {
      const row = (
        id: string,
        status: string,
        expiresAt: Date,
        branchIds: string[],
      ) => ({
        id,
        email: `${id}@x.lk`,
        roleId: 'r',
        roleName: 'Member',
        branchIds,
        status,
        invitedByName: 'N',
        expiresAt,
        lastSentAt: null,
        sendCount: 1,
        createdAt: new Date(),
      });
      repo.list.mockResolvedValue([
        row('a', 'pending', new Date(Date.now() - 1000), []),
        row('b', 'pending', new Date(Date.now() + 1e7), [KOT]),
        row('c', 'accepted', new Date(Date.now() - 1000), [KOT]),
      ]);

      const all = await useCase.list(actor());
      expect(all.map((r) => [r.id, r.status])).toEqual([
        ['a', 'expired'],
        ['b', 'pending'],
        ['c', 'accepted'],
      ]);

      const limited = await useCase.list(actor({ restricted: [KOT] }));
      expect(limited.map((r) => r.id)).toEqual(['b', 'c']);
    });
  });

  describe('accept', () => {
    const token = newInvitationToken();
    const pending = {
      id: 'inv-1',
      businessId: BIZ,
      email: 'ishara@apertureretail.lk',
      roleId: ROLE_CASHIER,
      branchIds: [KOT],
      status: 'pending',
      expiresAt: new Date(Date.now() + 86_400_000),
    };

    it('creates the membership (with branch limits) and marks the invitation used', async () => {
      repo.lockByTokenHash.mockResolvedValue(pending);

      const result = await useCase.accept('user_new', token);

      expect(repo.lockByTokenHash).toHaveBeenCalledWith(
        'tx',
        hashInvitationToken(token),
      );
      expect(repo.addMember).toHaveBeenCalledWith('tx', {
        orgId: ORG,
        userId: 'user_new',
        roleId: ROLE_CASHIER,
        branchIds: [KOT],
      });
      expect(repo.update).toHaveBeenCalledWith(
        'tx',
        'inv-1',
        expect.objectContaining({ status: 'accepted', acceptedBy: 'user_new' }),
      );
      expect(accessService.invalidateMember).toHaveBeenCalledWith(
        ORG,
        'user_new',
      );
      expect(result).toEqual({
        orgId: ORG,
        slug: 'aperture-retail',
        organizationName: 'Aperture Retail',
      });
    });

    it('only the holder of the invited (verified) email can accept', async () => {
      repo.lockByTokenHash.mockResolvedValue(pending);
      identity.get.mockResolvedValue({
        userId: 'x',
        name: 'X',
        verifiedEmails: ['someone.else@x.lk'],
      });

      await expect(useCase.accept('user_x', token)).rejects.toThrow(
        ForbiddenException,
      );
      expect(repo.addMember).not.toHaveBeenCalled();
    });

    it('refuses expired, revoked and already-used links', async () => {
      repo.lockByTokenHash.mockResolvedValue({
        ...pending,
        expiresAt: new Date(Date.now() - 1),
      });
      await expect(useCase.accept('u', token)).rejects.toThrow(/expired/);

      repo.lockByTokenHash.mockResolvedValue({ ...pending, status: 'revoked' });
      await expect(useCase.accept('u', token)).rejects.toThrow(GoneException);

      repo.lockByTokenHash.mockResolvedValue({
        ...pending,
        status: 'accepted',
        acceptedBy: 'other',
      });
      await expect(useCase.accept('u', token)).rejects.toThrow(/already used/);
      expect(repo.addMember).not.toHaveBeenCalled();
    });

    it('is idempotent for the person who already accepted it', async () => {
      repo.lockByTokenHash.mockResolvedValue({
        ...pending,
        status: 'accepted',
        acceptedBy: 'user_new',
      });
      await expect(useCase.accept('user_new', token)).resolves.toMatchObject({
        slug: 'aperture-retail',
      });
      expect(repo.addMember).not.toHaveBeenCalled();
    });

    it('does not add a second membership for someone who already belongs', async () => {
      repo.lockByTokenHash.mockResolvedValue(pending);
      repo.isMember.mockResolvedValue(true);
      await useCase.accept('user_new', token);
      expect(repo.addMember).not.toHaveBeenCalled();
    });

    it('rejects junk tokens without touching the database', async () => {
      await expect(useCase.accept('u', 'short')).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.transaction).not.toHaveBeenCalled();
    });
  });

  describe('lookup', () => {
    it('describes a valid link and reports expiry', async () => {
      const token = newInvitationToken();
      repo.lookupContext.mockResolvedValue({
        email: 'ishara@apertureretail.lk',
        status: 'pending',
        branchIds: [],
        expiresAt: new Date(Date.now() - 1),
        createdAt: new Date(),
        lastSentAt: null,
        organizationName: 'Aperture Retail',
        organizationSlug: 'aperture-retail',
        roleName: 'Member',
        invitedByName: 'Nadeesha',
      });

      const r = await useCase.lookup(token);
      expect(r).toMatchObject({
        status: 'expired',
        organizationName: 'Aperture Retail',
        roleName: 'Member',
      });
      expect(repo.lookupContext).toHaveBeenCalledWith(
        hashInvitationToken(token),
      );
    });

    it('unknown and malformed tokens are just "not found"', async () => {
      repo.lookupContext.mockResolvedValue(undefined);
      await expect(useCase.lookup(newInvitationToken())).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.lookup('nope')).rejects.toThrow(NotFoundException);
    });
  });
});
