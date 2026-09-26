/**
 * Host-based multi-tenancy.
 *
 *   <root domain>            sign in, sign up, onboarding, workspace picker
 *   www.<root domain>        alias of the root (the marketing site, if you host
 *                            it there, is a separate deployment)
 *   <slug>.<root domain>     one business's workspace
 *
 * A single wildcard DNS record (`*.<root domain>`) serves every workspace, so
 * nothing is created per business at runtime. The proxy reads the host, and
 * internally rewrites `<slug>.<root>/reports` to `/org/<slug>/reports` while the
 * browser keeps showing the clean URL.
 */

export type HostKind =
  /** The root domain: the product's front door. */
  | { kind: "root" }
  /** `www.<root>`: an alias that just goes to the root. */
  | { kind: "www" }
  | { kind: "org"; slug: string }
  /** A host that is not under the root domain (e.g. plain localhost). */
  | { kind: "external" }
  /** Under the root domain but not a valid single label. */
  | { kind: "unknown" };

const LABEL = /^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/;

/** Subdomains that are never workspaces (mirrors the API's reserved words). */
const NOT_WORKSPACES = new Set(["app", "www"]);

export function parseHost(
  hostHeader: string | null | undefined,
  rootDomain: string,
): HostKind {
  const host = (hostHeader ?? "").trim().toLowerCase();
  const root = rootDomain.trim().toLowerCase();
  if (!host || !root) return { kind: "external" };

  if (host === root) return { kind: "root" };
  if (host === `www.${root}`) return { kind: "www" };
  if (!host.endsWith(`.${root}`)) return { kind: "external" };

  const label = host.slice(0, -(root.length + 1));
  if (label.includes(".") || NOT_WORKSPACES.has(label) || !LABEL.test(label)) {
    return { kind: "unknown" };
  }
  return { kind: "org", slug: label };
}

export interface TenancyConfig {
  rootDomain: string;
  protocol: "http" | "https";
}

export function tenancyConfig(): TenancyConfig {
  return {
    rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "",
    protocol:
      process.env.NEXT_PUBLIC_WEB_PROTOCOL === "https" ? "https" : "http",
  };
}

/** Absolute URL of a workspace: `https://kottawa.example.com/reports`. */
export function orgUrl(
  slug: string,
  path = "/",
  config: TenancyConfig = tenancyConfig(),
) {
  return `${config.protocol}://${slug}.${config.rootDomain}${path}`;
}

/** Absolute URL on the root domain (sign in, onboarding, picker). */
export function baseUrl(path = "/", config: TenancyConfig = tenancyConfig()) {
  return `${config.protocol}://${config.rootDomain}${path}`;
}

/** Same as `baseUrl`: the app lives on the root domain. */
export const appUrl = baseUrl;
