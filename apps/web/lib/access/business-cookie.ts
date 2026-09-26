/**
 * Cookies holding the business (`orgId`) and branch (uuid) the user is working
 * in. They are only *selections*: the API validates both against the user's
 * memberships and branch access on every request, so tampering with them grants
 * nothing.
 */
export const BUSINESS_COOKIE = "eclipso_business";
export const BRANCH_COOKIE = "eclipso_branch";
export const BUSINESS_HEADER = "x-business-id";
export const BRANCH_HEADER = "x-branch-id";
/** Internal marker: send this request without the selected branch. */
export const NO_BRANCH_MARKER = "x-eclipso-no-branch";
/** Internal marker: send this request without business or branch selection. */
export const NO_SCOPE_MARKER = "x-eclipso-no-scope";
