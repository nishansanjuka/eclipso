import { Injectable } from '@nestjs/common';
import { clerkClient } from '@clerk/express';

export interface ClerkIdentity {
  userId: string;
  name: string;
  /** Verified email addresses, lower-cased. */
  verifiedEmails: string[];
}

/**
 * What Clerk knows about a user. Used only to prove *which email* someone
 * controls (invitations are bound to an email); roles and organizations are
 * never read from Clerk.
 */
@Injectable()
export class ClerkIdentityService {
  async get(userId: string): Promise<ClerkIdentity> {
    const user = await clerkClient.users.getUser(userId);
    const verifiedEmails = user.emailAddresses
      .filter((e) => e.verification?.status === 'verified')
      .map((e) => e.emailAddress.toLowerCase());
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      user.username ||
      verifiedEmails[0] ||
      'User';
    return { userId, name, verifiedEmails };
  }
}
