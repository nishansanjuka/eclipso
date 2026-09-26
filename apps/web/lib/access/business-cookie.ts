/**
 * Which business a request is for comes from the host (`<slug>.<root domain>`,
 * see lib/tenancy). The branch the user is working in is a cookie: it is only a
 * *selection*, validated by the API on every request, and being host-only it is
 * remembered separately per workspace.
 */
export const BRANCH_COOKIE = "eclipso_branch";
export const SLUG_HEADER = "x-business-slug";
export const BRANCH_HEADER = "x-branch-id";
/** Set by the proxy from the host; read by server code to scope API calls. */
export const ORG_SLUG_REQUEST_HEADER = "x-org-slug";
/** Internal marker: send this request without the selected branch. */
export const NO_BRANCH_MARKER = "x-eclipso-no-branch";
/** Internal marker: send this request without business or branch selection. */
export const NO_SCOPE_MARKER = "x-eclipso-no-scope";
