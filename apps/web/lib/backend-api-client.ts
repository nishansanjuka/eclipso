import "server-only";
import ky from "ky";
import { auth } from "@clerk/nextjs/server";
import { cookies, headers } from "next/headers";
import { AppError } from "@/lib/action-client";
import {
  BRANCH_COOKIE,
  BRANCH_HEADER,
  NO_BRANCH_MARKER,
  NO_SCOPE_MARKER,
  ORG_SLUG_REQUEST_HEADER,
  SLUG_HEADER,
} from "@/lib/access/business-cookie";

const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:3000";

/**
 * Server-side client for apps/api.
 *
 * Injects the caller's Clerk session token (identity only), the business named
 * by the workspace host (`X-Business-Slug`) and the selected branch
 * (`X-Branch-Id`). The API resolves role, permissions and branch access from
 * its own database and re-validates both on every request.
 */
export const backendApiClient = ky.create({
  prefix: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        const skipScope = request.headers.has(NO_SCOPE_MARKER);
        const skipBranch = skipScope || request.headers.has(NO_BRANCH_MARKER);
        request.headers.delete(NO_SCOPE_MARKER);
        request.headers.delete(NO_BRANCH_MARKER);
        try {
          const { getToken } = await auth();
          const token = await getToken();
          if (token) request.headers.set("Authorization", `Bearer ${token}`);

          if (!skipScope) {
            const slug = (await headers()).get(ORG_SLUG_REQUEST_HEADER);
            if (slug && !request.headers.has(SLUG_HEADER)) {
              request.headers.set(SLUG_HEADER, slug);
            }
          }
          const branchId = (await cookies()).get(BRANCH_COOKIE)?.value;
          if (branchId && !skipBranch && !request.headers.has(BRANCH_HEADER)) {
            request.headers.set(BRANCH_HEADER, branchId);
          }
        } catch (err) {
          // Not in a request scope (e.g. static rendering at build time).
          console.debug("Could not attach auth to backend request:", err);
        }
      },
    ],
    afterResponse: [
      async ({ response }) => {
        if (response.ok) return;
        let message = `Request failed (${response.status})`;
        try {
          const body = (await response.clone().json()) as {
            message?: string | string[];
          };
          if (Array.isArray(body.message)) message = body.message.join(", ");
          else if (body.message) message = body.message;
        } catch {
          // Non-JSON error body: keep the generic message.
        }
        // Surface the API's own message (e.g. "Insufficient stock ...") to the UI.
        throw new AppError("API_ERROR", response.status, message);
      },
    ],
  },
});

export { NO_BRANCH_MARKER, NO_SCOPE_MARKER };
