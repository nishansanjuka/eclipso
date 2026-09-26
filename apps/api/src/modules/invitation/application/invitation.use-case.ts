import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { loadConfig } from '../../../shared/config';
import { ClerkIdentityService } from '../../../shared/services/clerk-identity.service';
import { MailService } from '../../../shared/services/mail.service';
import { isUniqueViolation } from '../../../shared/utils/pg-errors';
import { type AuthContext } from '../../auth/domain/auth-context';
import { type PermissionType } from '../../auth/enums/auth-permissions.enum';
import { AccessRepository } from '../../auth/infrastructure/access.repository';
import { AccessService } from '../../auth/infrastructure/access.service';
import { BusinessService } from '../../business/infrastructure/business.service';
import {
  addDays,
  hashInvitationToken,
  looksLikeToken,
  newInvitationToken,
} from '../domain/invitation-token';
import { renderInvitationEmail } from '../domain/invitation-email';
import { InvitationRepository } from '../infrastructure/invitation.repository';

export interface InvitationRequest {
  email: string;
  roleId: string;
  branchIds?: string[];
}

export type InvitationStatusView =
  | 'pending'
  | 'accepted'
  | 'revoked'
  | 'expired';

type Actor = Pick<
  AuthContext,
  | 'userId'
  | 'orgId'
  | 'businessId'
  | 'has'
  | 'branchRestricted'
  | 'canAccessBranch'
>;

/**
 * Invitations: an owner/admin invites a co-worker by email into one business
 * with a role (and optionally only some branches). The email carries a link to
 * the business's own workspace address; accepting it is bound to a verified
 * email that matches the invitation.
 *
 * Rules enforced here, not just at the route:
 *  - you can only invite into a role whose permissions you hold yourself;
 *  - a branch-limited inviter can only invite into their own branches;
 *  - only a hash of the link token is stored; a resend replaces the token, so
 *    the previous link stops working the moment a new one is sent;
 *  - an invitation works once, and only until it expires.
 */
@Injectable()
export class InvitationUseCase {
  constructor(
    private readonly repository: InvitationRepository,
    private readonly access: AccessRepository,
    private readonly accessService: AccessService,
    private readonly businessService: BusinessService,
    private readonly mail: MailService,
    private readonly identity: ClerkIdentityService,
  ) {}

  // ── admin side ────────────────────────────────────────────────────────────

  async list(actor: Actor) {
    const rows = await this.repository.list(actor.businessId!);
    const now = new Date();

    return rows
      .filter((row) => this.visibleTo(actor, row.branchIds))
      .map((row) => ({
        id: row.id,
        email: row.email,
        roleId: row.roleId,
        roleName: row.roleName,
        branchIds: row.branchIds,
        status: this.statusOf(row.status, row.expiresAt, now),
        invitedByName: row.invitedByName,
        expiresAt: row.expiresAt,
        lastSentAt: row.lastSentAt,
        sendCount: row.sendCount,
        createdAt: row.createdAt,
      }));
  }

  async create(actor: Actor, requests: InvitationRequest[]) {
    const business = await this.businessService.getProfile(actor.orgId!);
    if (!business) throw new NotFoundException('Business not found.');
    const inviter = await this.identity.get(actor.userId).catch(() => null);

    const results: Array<
      | {
          email: string;
          ok: true;
          id: string;
          inviteUrl: string;
          emailSent: boolean;
          emailError?: string;
        }
      | { email: string; ok: false; error: string }
    > = [];

    // One at a time: each is its own transaction, so one bad row never blocks the rest.
    for (const request of requests) {
      try {
        const sent = await this.createOne(
          actor,
          business,
          inviter?.name,
          request,
        );
        results.push({ email: request.email, ok: true, ...sent });
      } catch (error) {
        if (error instanceof ForbiddenException) {
          results.push({
            email: request.email,
            ok: false,
            error: error.message,
          });
        } else if (
          error instanceof NotFoundException ||
          error instanceof BadRequestException ||
          error instanceof ConflictException
        ) {
          results.push({
            email: request.email,
            ok: false,
            error: error.message,
          });
        } else {
          throw error;
        }
      }
    }
    return { results };
  }

  async resend(actor: Actor, id: string) {
    const business = await this.businessService.getProfile(actor.orgId!);
    if (!business) throw new NotFoundException('Business not found.');
    const inviter = await this.identity.get(actor.userId).catch(() => null);

    const { invitation, token } = await this.repository.transaction(
      async (tx) => {
        const current = await this.repository.lockById(
          tx,
          actor.businessId!,
          id,
        );
        if (!current || !this.visibleTo(actor, current.branchIds)) {
          throw new NotFoundException('Invitation not found.');
        }
        if (current.status !== 'pending') {
          throw new ConflictException(
            current.status === 'accepted'
              ? 'This invitation was already accepted.'
              : 'This invitation was revoked. Send a new one instead.',
          );
        }
        await this.assertCanInviteInto(actor, current.roleId);

        const token = newInvitationToken();
        const invitation = await this.repository.update(tx, current.id, {
          tokenHash: hashInvitationToken(token),
          expiresAt: addDays(new Date(), loadConfig().INVITATION_TTL_DAYS),
        });
        return { invitation, token };
      },
    );

    const delivery = await this.deliver(
      business,
      inviter?.name,
      invitation,
      token,
    );
    return { id: invitation.id, ...delivery };
  }

  async revoke(actor: Actor, id: string) {
    await this.repository.transaction(async (tx) => {
      const current = await this.repository.lockById(tx, actor.businessId!, id);
      if (!current || !this.visibleTo(actor, current.branchIds)) {
        throw new NotFoundException('Invitation not found.');
      }
      if (current.status === 'accepted') {
        throw new ConflictException(
          'Already accepted: remove the member instead.',
        );
      }
      if (current.status === 'revoked') return;
      await this.repository.update(tx, current.id, {
        status: 'revoked',
        revokedAt: new Date(),
      });
    });
    return { id };
  }

  // ── invitee side ──────────────────────────────────────────────────────────

  /**
   * Public: what the link is for, so the page can say "Join Aperture Retail".
   * Reveals the invited email (needed to prefill sign up) but no ids; a wrong or
   * malformed token is a plain "not found".
   */
  async lookup(token: string) {
    if (!looksLikeToken(token))
      throw new NotFoundException('Invitation not found.');
    const row = await this.repository.lookupContext(hashInvitationToken(token));
    if (!row) throw new NotFoundException('Invitation not found.');

    const status = this.statusOf(row.status, row.expiresAt, new Date());
    return {
      status,
      email: row.email,
      organizationName: row.organizationName,
      organizationSlug: row.organizationSlug,
      roleName: row.roleName,
      branchNames: await this.repository.branchNames(row.branchIds),
      invitedByName: row.invitedByName,
      sentAt: row.lastSentAt ?? row.createdAt,
      expiresAt: row.expiresAt,
    };
  }

  /**
   * Turns a valid invitation into a membership for the signed-in user. The
   * user must control the invited email (verified with the identity provider),
   * so a forwarded link cannot be used by someone else.
   */
  async accept(userId: string, token: string) {
    if (!looksLikeToken(token))
      throw new NotFoundException('Invitation not found.');
    const identity = await this.identity.get(userId);

    const result = await this.repository.transaction(async (tx) => {
      const invitation = await this.repository.lockByTokenHash(
        tx,
        hashInvitationToken(token),
      );
      if (!invitation) throw new NotFoundException('Invitation not found.');

      if (invitation.status === 'revoked') {
        throw new GoneException('This invitation was revoked.');
      }
      if (
        invitation.status === 'pending' &&
        invitation.expiresAt < new Date()
      ) {
        throw new GoneException(
          'This invitation has expired. Ask for a new one.',
        );
      }
      if (!identity.verifiedEmails.includes(invitation.email)) {
        throw new ForbiddenException(
          `This invitation is for ${invitation.email}. Sign in with that verified email address.`,
        );
      }

      const business = await this.repository.businessOf(
        tx,
        invitation.businessId,
      );
      if (!business) throw new NotFoundException('Invitation not found.');

      if (invitation.status === 'accepted') {
        // Same person opening the link again: fine, take them to the workspace.
        if (invitation.acceptedBy === userId) return business;
        throw new GoneException('This invitation was already used.');
      }

      await this.repository.ensureUser(tx, userId, identity.name);
      if (!(await this.repository.isMember(tx, business.orgId, userId))) {
        await this.repository.addMember(tx, {
          orgId: business.orgId,
          userId,
          roleId: invitation.roleId,
          branchIds: invitation.branchIds,
        });
      }
      await this.repository.update(tx, invitation.id, {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy: userId,
      });
      return business;
    });

    this.accessService.invalidateMember(result.orgId, userId);
    return {
      orgId: result.orgId,
      slug: result.slug,
      organizationName: result.name,
    };
  }

  // ── internals ─────────────────────────────────────────────────────────────

  private async createOne(
    actor: Actor,
    business: { name: string; slug: string },
    inviterName: string | undefined,
    request: InvitationRequest,
  ) {
    const branchIds = request.branchIds ?? [];
    await this.assertCanInviteInto(actor, request.roleId);
    await this.assertBranchesAllowed(actor, branchIds);

    const token = newInvitationToken();
    const values = {
      tokenHash: hashInvitationToken(token),
      roleId: request.roleId,
      branchIds,
      expiresAt: addDays(new Date(), loadConfig().INVITATION_TTL_DAYS),
      invitedBy: actor.userId,
    };

    let invitation;
    try {
      invitation = await this.repository.transaction(async (tx) => {
        // Inviting someone who already has a pending invitation re-issues it.
        const existing = await this.repository.lockPendingByEmail(
          tx,
          actor.businessId!,
          request.email,
        );
        if (existing) {
          if (!this.visibleTo(actor, existing.branchIds)) {
            throw new ConflictException(
              'This person already has a pending invitation from another branch.',
            );
          }
          return this.repository.update(tx, existing.id, values);
        }
        return this.repository.insert(tx, {
          businessId: actor.businessId!,
          email: request.email,
          ...values,
        });
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'This email already has a pending invitation.',
        );
      }
      throw error;
    }

    const delivery = await this.deliver(
      business,
      inviterName,
      invitation,
      token,
    );
    return { id: invitation.id, ...delivery };
  }

  /** Sends the email; a mail failure is reported, never thrown. */
  private async deliver(
    business: { name: string; slug: string },
    inviterName: string | undefined,
    invitation: {
      id: string;
      email: string;
      roleId: string;
      branchIds: string[];
      expiresAt: Date;
    },
    token: string,
  ) {
    const config = loadConfig();
    const inviteUrl = `${config.WEB_PROTOCOL}://${business.slug}.${config.WEB_ROOT_DOMAIN}/invite/${token}`;

    const role = await this.access.findRole(invitation.roleId);
    const message = renderInvitationEmail({
      organizationName: business.name,
      inviterName: inviterName ?? 'A colleague',
      roleName: role?.name ?? 'team member',
      branchNames: await this.repository.branchNames(invitation.branchIds),
      link: inviteUrl,
      expiresAt: invitation.expiresAt,
    });
    const result = await this.mail.send({ to: invitation.email, ...message });

    if (result.sent) {
      await this.repository.markSent(invitation.id);
    }
    return {
      inviteUrl,
      emailSent: result.sent,
      ...(result.sent ? {} : { emailError: result.reason }),
    };
  }

  /** You may only invite into a role whose permissions you hold yourself. */
  private async assertCanInviteInto(actor: Actor, roleId: string) {
    const role = await this.access.findRole(roleId);
    const usable =
      role && (role.businessId === null || role.businessId === actor.orgId);
    if (!usable) throw new NotFoundException('Role not found.');

    const missing = role.permissions.filter(
      (p) => !actor.has(p as PermissionType),
    );
    if (missing.length > 0) {
      throw new ForbiddenException(
        `You cannot invite someone into a role with permissions you do not hold: ${missing.join(', ')}`,
      );
    }
  }

  private async assertBranchesAllowed(actor: Actor, branchIds: string[]) {
    if (actor.branchRestricted) {
      if (branchIds.length === 0) {
        throw new ForbiddenException(
          'You are limited to specific branches: choose which of them this person works in.',
        );
      }
      if (branchIds.some((id) => !actor.canAccessBranch(id))) {
        throw new ForbiddenException(
          'You cannot invite people into branches you cannot work in yourself.',
        );
      }
    }
    if (branchIds.length > 0) {
      const valid = await this.access.branchIdsInBusiness(
        actor.businessId!,
        branchIds,
      );
      if (valid.length !== branchIds.length) {
        throw new NotFoundException('Branch not found.');
      }
    }
  }

  /** A branch-limited manager only sees invitations inside their own branches. */
  private visibleTo(actor: Actor, branchIds: string[]) {
    if (!actor.branchRestricted) return true;
    return (
      branchIds.length > 0 && branchIds.every((id) => actor.canAccessBranch(id))
    );
  }

  private statusOf(
    status: 'pending' | 'accepted' | 'revoked',
    expiresAt: Date,
    now: Date,
  ): InvitationStatusView {
    return status === 'pending' && expiresAt < now ? 'expired' : status;
  }
}
