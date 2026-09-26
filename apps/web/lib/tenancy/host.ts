/**
 * Host-based multi-tenancy.
 *
 *   <root domain>            marketing site (a separate app); we send people on
 *   app.<root domain>        sign in, sign up, onboarding, workspace picker
 *   <slug>.<root domain>     one business's workspace
 *
 * A single wildcard DNS record (`*.<root domain>`) serves every workspace, so
 * nothing is created per business at runtime. The proxy reads the host, and
 * internally rewrites `<slug>.<root>/reports` to `/org/<slug>/reports` while the
 * browser keeps showing the clean URL.
 */

export type HostKind =
  | { kind: "root" }
  | { kind: "app" }
  | { kind: "org"; slug: string }
  /** A host that is not under the root domain (e.g. plain localhost). */
  | { kind: "external" }
  /** Under the root domain but not a valid single label. */
  | { kind: "unknown" };

const LABEL = /^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/;

export const APP_SUBDOMAIN = "app";

/** Subdomains that are never workspaces (mirrors the API's reserved words). */
const NOT_WORKSPACES = new Set([APP_SUBDOMAIN, "www"]);

export function parseHost(
  hostHeader: string | null | undefined,
  rootDomain: string,
): HostKind {
  const host = (hostHeader ?? "").trim().toLowerCase();
  const root = rootDomain.trim().toLowerCase();
  if (!host || !root) return { kind: "external" };

  if (host === root || host === `www.${root}`) return { kind: "root" };
  if (host === `${APP_SUBDOMAIN}.${root}`) return { kind: "app" };
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

/** Absolute URL on the app host (sign in, onboarding, picker). */
export function appUrl(path = "/", config: TenancyConfig = tenancyConfig()) {
  return `${config.protocol}://${APP_SUBDOMAIN}.${config.rootDomain}${path}`;
}
