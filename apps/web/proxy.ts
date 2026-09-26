import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { baseUrl, parseHost, tenancyConfig } from "@/lib/tenancy/host";
import { workspaceExists } from "@/lib/tenancy/workspace-exists";

/** Pages anyone may open, on every host. */
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/invite(.*)",
  "/api/public(.*)",
]);

/** Paths that exist once, at the app root, and are never workspace pages. */
const isAppOnlyRoute = createRouteMatcher(["/onboarding(.*)"]);

/** The internal route tree must never be reachable by typing it in. */
const isInternalRoute = createRouteMatcher(["/org", "/org/(.*)"]);

const SLUG_HEADER = "x-org-slug";

function notFound(req: NextRequest) {
  return NextResponse.rewrite(new URL("/_not-found", req.url), { status: 404 });
}

export default clerkMiddleware(async (auth, req) => {
  const config = tenancyConfig();
  const host = req.headers.get("host");
  const target = parseHost(host, config.rootDomain);
  const { pathname, search } = req.nextUrl;

  // A client must not smuggle in the internal header or route.
  if (isInternalRoute(req)) return notFound(req);
  const headers = new Headers(req.headers);
  headers.delete(SLUG_HEADER);

  // www.<root> is just an alias of the root domain.
  if (target.kind === "www") {
    return NextResponse.redirect(baseUrl(pathname + search, config));
  }
  // An address nobody can own (malformed, nested) goes to the base domain.
  if (target.kind === "unknown") {
    return NextResponse.redirect(baseUrl("/", config));
  }
  // A well-formed address that no business owns: nothing lives here, so send
  // the visitor to the base domain instead of an empty shell.
  if (target.kind === "org" && !(await workspaceExists(target.slug))) {
    return NextResponse.redirect(baseUrl("/", config));
  }

  if (isPublicRoute(req)) {
    // Invitation links live on the workspace host; keep the slug available so
    // the page can show the organisation even before anyone signs in.
    if (target.kind === "org") headers.set(SLUG_HEADER, target.slug);
    return NextResponse.next({ request: { headers } });
  }

  // Everything else needs a signed-in user. Sign in on the host being visited:
  // with a production Clerk instance the session is shared across subdomains
  // anyway, and with a development instance each host keeps its own session, so
  // this is the only place signing in can work.
  const { userId } = await auth();
  if (!userId) {
    const signIn = new URL("/sign-in", req.url);
    signIn.searchParams.set(
      "redirect_url",
      `${config.protocol}://${host}${pathname}${search}`,
    );
    return NextResponse.redirect(signIn);
  }

  if (target.kind === "org") {
    if (isAppOnlyRoute(req)) {
      return NextResponse.redirect(baseUrl(pathname + search, config));
    }
    headers.set(SLUG_HEADER, target.slug);
    const url = req.nextUrl.clone();
    url.pathname = `/org/${target.slug}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url, { request: { headers } });
  }

  // Root domain (or plain localhost): picker, onboarding.
  return NextResponse.next({ request: { headers } });
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
