import "server-only";
import ky from "ky";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { BUSINESS_COOKIE, BUSINESS_HEADER } from "@/lib/access/business-cookie";

const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:3000";

/**
 * Server-side client for apps/api.
 *
 * Injects the caller's Clerk session token (identity only) and the selected
 * business (`X-Business-Id`). The API resolves role and permissions from its
 * own database and re-validates the business on every request.
 */
export const backendApiClient = ky.create({
  prefix: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        try {
          const { getToken } = await auth();
          const token = await getToken();
          if (token) request.headers.set("Authorization", `Bearer ${token}`);

          const businessId = (await cookies()).get(BUSINESS_COOKIE)?.value;
          if (businessId && !request.headers.has(BUSINESS_HEADER)) {
            request.headers.set(BUSINESS_HEADER, businessId);
          }
        } catch (err) {
          // Not in a request scope (e.g. static rendering at build time).
          console.debug("Could not attach auth to backend request:", err);
        }
      },
    ],
  },
});
