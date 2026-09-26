import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { appUrl, parseHost, tenancyConfig } from "@/lib/tenancy/host";

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
/** Added to the return address after sign in; seeing it again means no session. */
const RETURNED_MARKER = "__ws";

function sessionNotSharedPage(host: string, root: string) {
  const esc = (v: string) =>
    v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  return `<!doctype html><meta charset="utf-8"><title>Session not shared</title>
<body style="font:15px/1.5 system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 24px;color:#1c1b19;background:#f7f5f1">
<h1 style="font-size:24px">You are signed in, but not on this address</h1>
<p>You signed in on <b>app.${esc(root)}</b>, but <b>${esc(host)}</b> did not receive your session.</p>
<p>Sessions are shared across workspace addresses through a cookie on the root domain. That needs a <b>production Clerk instance</b> configured for <b>${esc(root)}</b>; Clerk development instances keep sessions per host.</p>
<p><a href="/sign-in" style="color:#2f5bd3">Try signing in again</a></p></body>`;
}

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

  // Marketing host: this app only serves the product, so send people there.
  if (target.kind === "root") {
    return NextResponse.redirect(appUrl(pathname + search, config));
  }
  if (target.kind === "unknown") return notFound(req);

  if (isPublicRoute(req)) {
    // Invitation links live on the workspace host; keep the slug available so
    // the page can show the organisation even before anyone signs in.
    if (target.kind === "org") headers.set(SLUG_HEADER, target.slug);
    return NextResponse.next({ request: { headers } });
  }

  // Everything else needs a signed-in user. Sign-in itself happens on the app
  // host, then sends people back to where they were going.
  const { userId } = await auth();
  if (!userId) {
    // We already sent this browser to sign in and it came straight back without
    // a session: the session is not shared with this host. Redirecting again
    // would loop forever, so say what is wrong instead.
    if (req.nextUrl.searchParams.has(RETURNED_MARKER)) {
      return new NextResponse(
        sessionNotSharedPage(host ?? "", config.rootDomain),
        {
          status: 401,
          headers: { "content-type": "text/html; charset=utf-8" },
        },
      );
    }
    const back = new URL(`${config.protocol}://${host}${pathname}${search}`);
    back.searchParams.set(RETURNED_MARKER, "1");
    const signIn = config.rootDomain
      ? new URL(appUrl("/sign-in", config))
      : new URL("/sign-in", req.url);
    signIn.searchParams.set("redirect_url", back.toString());
    return NextResponse.redirect(signIn);
  }

  // Signed in and back from the sign-in round trip: drop the marker from the URL.
  if (req.nextUrl.searchParams.has(RETURNED_MARKER)) {
    const clean = req.nextUrl.clone();
    clean.searchParams.delete(RETURNED_MARKER);
    return NextResponse.redirect(clean);
  }

  if (target.kind === "org") {
    if (isAppOnlyRoute(req)) {
      return NextResponse.redirect(appUrl(pathname + search, config));
    }
    headers.set(SLUG_HEADER, target.slug);
    const url = req.nextUrl.clone();
    url.pathname = `/org/${target.slug}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url, { request: { headers } });
  }

  // App host (or plain localhost): picker, onboarding.
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
