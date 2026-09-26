import { createHash, randomBytes } from 'node:crypto';

/** 256 bits of randomness, URL-safe. Only its hash is ever stored. */
export function newInvitationToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Cheap shape check so junk never reaches the database. */
export function looksLikeToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 86_400_000);
}
