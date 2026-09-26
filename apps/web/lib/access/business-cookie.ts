/**
 * Cookie holding the id (`orgId`) of the business the user is working in.
 * It is only a *selection*: the API validates it against the user's
 * memberships on every request, so tampering with it grants nothing.
 */
export const BUSINESS_COOKIE = "eclipso_business";
export const BUSINESS_HEADER = "x-business-id";
