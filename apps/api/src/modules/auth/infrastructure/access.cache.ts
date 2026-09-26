/**
 * Tiny bounded in-process TTL cache for resolved memberships.
 *
 * Safety properties:
 *  - Server-side only. Nothing derived from it is ever handed to a client, so
 *    there is no token to forge or replay.
 *  - Keyed by (orgId, userId) where both come from a verified session and a
 *    DB-validated membership, never from raw request input.
 *  - Only positive lookups are stored, so a new grant is visible immediately.
 *  - Every mutation in this module invalidates the affected entries; the TTL is
 *    the upper bound on staleness for other API instances (revocation lag).
 *    Set ACCESS_CACHE_TTL_MS=0 to disable caching entirely.
 */
export class AccessCache<T> {
  private readonly entries = new Map<string, { value: T; expires: number }>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 5000,
  ) {}

  private static key(orgId: string, userId: string) {
    return `${orgId}\u0000${userId}`;
  }

  get(orgId: string, userId: string): T | undefined {
    if (this.ttlMs <= 0) return undefined;
    const key = AccessCache.key(orgId, userId);
    const hit = this.entries.get(key);
    if (!hit) return undefined;
    if (hit.expires <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(orgId: string, userId: string, value: T): void {
    if (this.ttlMs <= 0) return;
    if (this.entries.size >= this.maxEntries) {
      // Maps iterate in insertion order: drop the oldest entry.
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.entries.set(AccessCache.key(orgId, userId), {
      value,
      expires: Date.now() + this.ttlMs,
    });
  }

  invalidateMember(orgId: string, userId: string): void {
    this.entries.delete(AccessCache.key(orgId, userId));
  }

  invalidateBusiness(orgId: string): void {
    const prefix = `${orgId}\u0000`;
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) this.entries.delete(key);
    }
  }

  invalidateUser(userId: string): void {
    const suffix = `\u0000${userId}`;
    for (const key of this.entries.keys()) {
      if (key.endsWith(suffix)) this.entries.delete(key);
    }
  }

  clear(): void {
    this.entries.clear();
  }
}
