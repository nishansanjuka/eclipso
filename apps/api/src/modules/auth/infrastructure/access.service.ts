import {
  ForbiddenException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { loadConfig } from '../../../shared/config';
import { AuthContext } from '../domain/auth-context';
import { AccessCache } from './access.cache';
import { AccessRepository, MembershipRecord } from './access.repository';

/**
 * Resolves "who is this user inside this business" from our own DB on every
 * request (through a short server-side cache). Clerk only proves identity.
 */
@Injectable()
export class AccessService implements OnModuleInit {
  private readonly logger = new Logger(AccessService.name);
  private readonly cache = new AccessCache<MembershipRecord>(
    loadConfig().ACCESS_CACHE_TTL_MS,
  );

  constructor(private readonly repository: AccessRepository) {}

  async onModuleInit() {
    await this.repository.syncCatalog();
    this.logger.log('Permission catalog and system roles synced');
  }

  /**
   * Builds the request's auth context.
   *
   * - `requestedOrgId` (from the X-Business-Id header) is untrusted input: it
   *   only selects *which* of the user's memberships to use, and is rejected
   *   unless the DB confirms the membership.
   * - No header → the user's only business is used; several → the caller must
   *   choose; none → a business-less context (e.g. for creating a business).
   */
  async resolve(
    userId: string,
    requestedOrgId?: string,
    requestedBranchId?: string,
  ): Promise<AuthContext> {
    let orgId = requestedOrgId;

    if (!orgId) {
      const orgIds = await this.repository.listMembershipOrgIds(userId);
      // Several businesses and none chosen: a business-less context, so routes
      // that do not need one (listing businesses, accepting an invitation)
      // still work. Routes that need a business are refused by the guard.
      if (orgIds.length === 1) orgId = orgIds[0];
    }

    if (!orgId) return new AuthContext({ userId });

    const membership = await this.getMembership(userId, orgId);
    if (!membership) {
      // Same answer for "no such business" and "not your business" so the
      // header can't be used to probe which business ids exist.
      throw new ForbiddenException('You do not have access to this business.');
    }

    return new AuthContext({
      userId,
      orgId,
      businessId: membership.businessId,
      roleId: membership.roleId ?? undefined,
      roleKey: membership.roleKey ?? undefined,
      permissions: membership.permissions,
      branchId: this.pickBranch(membership, requestedBranchId),
      restrictedBranchIds: membership.restrictedBranchIds,
    });
  }

  /**
   * Which branch the request operates in.
   *
   * - `X-Branch-Id` is untrusted: it only chooses among the branches this
   *   member may operate in, and anything else is rejected with the same answer
   *   whether the branch is unknown, inactive or off-limits.
   * - No header: the default branch (if the member may use it), else their only
   *   branch, else none. Endpoints that need a branch then ask the caller to
   *   pick one; a single-branch business never needs the header.
   */
  private pickBranch(
    membership: MembershipRecord,
    requested?: string,
  ): string | undefined {
    const operable = membership.operableBranches;

    if (requested) {
      if (!operable.some((b) => b.id === requested)) {
        throw new ForbiddenException('You do not have access to this branch.');
      }
      return requested;
    }
    const preferred = operable.find((b) => b.isDefault);
    if (preferred) return preferred.id;
    return operable.length === 1 ? operable[0].id : undefined;
  }

  private async getMembership(userId: string, orgId: string) {
    const cached = this.cache.get(orgId, userId);
    if (cached) return cached;

    const membership = await this.repository.findMembership(userId, orgId);
    if (membership) this.cache.set(orgId, userId, membership);
    return membership;
  }

  // ── invalidation, called by every mutation that changes access ───────────

  invalidateMember(orgId: string, userId: string) {
    this.cache.invalidateMember(orgId, userId);
  }

  invalidateBusiness(orgId: string) {
    this.cache.invalidateBusiness(orgId);
  }

  invalidateUser(userId: string) {
    this.cache.invalidateUser(userId);
  }
}
