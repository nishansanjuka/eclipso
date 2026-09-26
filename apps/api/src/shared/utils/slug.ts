/**
 * Organization slugs become the workspace subdomain (`kottawa.example.com`), so
 * they must be safe DNS labels and must never shadow a host we use ourselves.
 */
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/;

const RESERVED = new Set([
  'www',
  'app',
  'api',
  'admin',
  'auth',
  'login',
  'signin',
  'signup',
  'sign-in',
  'sign-up',
  'accounts',
  'clerk',
  'mail',
  'email',
  'smtp',
  'ftp',
  'static',
  'assets',
  'cdn',
  'status',
  'support',
  'help',
  'docs',
  'blog',
  'dashboard',
  'billing',
  'staging',
  'dev',
  'test',
  'localhost',
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED.has(slug);
}

export function isValidSlug(slug: string): boolean {
  return (
    SLUG_PATTERN.test(slug) && !slug.includes('--') && !isReservedSlug(slug)
  );
}

/** "Keels Super (Pvt) Ltd" -> "keels-super-pvt-ltd" (may still need a suffix). */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\x00-\x7f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 40)
    .replace(/-+$/g, '');
}
