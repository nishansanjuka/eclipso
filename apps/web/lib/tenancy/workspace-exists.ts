const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:3000";

const TTL_MS = 60_000;
const MAX_ENTRIES = 2_000;
const cache = new Map<string, { exists: boolean; expires: number }>();

/**
 * Does a business own this workspace address? Asked of the API (public
 * endpoint) and remembered for a minute, so the proxy does not call it on every
 * request.
 *
 * Fails open: if the API cannot be reached we assume the workspace exists, so
 * an outage sends nobody away from a valid address. Failures are not cached.
 */
export async function workspaceExists(slug: string): Promise<boolean> {
  const now = Date.now();
  const hit = cache.get(slug);
  if (hit && hit.expires > now) return hit.exists;

  try {
    const response = await fetch(
      `${API_BASE_URL}/public/workspaces/${encodeURIComponent(slug)}/exists`,
      { signal: AbortSignal.timeout(3_000), cache: "no-store" },
    );
    if (!response.ok) return true;
    const { exists } = (await response.json()) as { exists: boolean };

    if (cache.size >= MAX_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(slug, { exists, expires: now + TTL_MS });
    return exists;
  } catch {
    return true;
  }
}
