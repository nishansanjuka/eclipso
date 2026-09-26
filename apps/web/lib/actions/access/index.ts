"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { actionClient } from "@/lib/action-client";
import { backendApiClient } from "@/lib/backend-api-client";
import { BUSINESS_COOKIE, BUSINESS_HEADER } from "@/lib/access/business-cookie";
import type { Permission } from "@/lib/access/permissions";

export interface BusinessSummary {
  orgId: string;
  name: string;
  businessType: string;
  roleKey: string | null;
}

export interface AccessSnapshot {
  userId: string;
  roleKey: string | null;
  permissions: Permission[];
  businesses: BusinessSummary[];
  /** The business the permissions were resolved for, if one is selected. */
  activeBusinessId: string | null;
}

/**
 * Who am I, which businesses can I work in, and what may I do in the selected
 * one. A stale selection (membership removed, business deleted) is ignored and
 * reported as "no active business" so the UI can pick a valid one.
 */
export const getAccess = actionClient.action(
  async (): Promise<AccessSnapshot> => {
    const selected = (await cookies()).get(BUSINESS_COOKIE)?.value ?? null;

    const businesses = await backendApiClient
      .get("auth/businesses")
      .json<BusinessSummary[]>();

    const valid = !!selected && businesses.some((b) => b.orgId === selected);
    const headers: Record<string, string> = valid
      ? { [BUSINESS_HEADER]: selected }
      : {};

    const me = await backendApiClient.get("auth/me", { headers }).json<{
      userId: string;
      roleKey: string | null;
      permissions: Permission[];
    }>();

    return {
      userId: me.userId,
      roleKey: valid ? me.roleKey : null,
      permissions: valid ? me.permissions : [],
      businesses,
      activeBusinessId: valid ? selected : null,
    };
  },
);

export const setActiveBusiness = actionClient
  .inputSchema(z.object({ orgId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/) }))
  .action(async ({ parsedInput }) => {
    (await cookies()).set(BUSINESS_COOKIE, parsedInput.orgId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return { orgId: parsedInput.orgId };
  });
