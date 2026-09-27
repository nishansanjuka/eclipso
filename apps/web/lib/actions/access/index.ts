"use server";

import { cookies, headers } from "next/headers";
import { z } from "zod";
import { actionClient } from "@/lib/action-client";
import { backendApiClient } from "@/lib/backend-api-client";
import {
  BRANCH_COOKIE,
  BRANCH_HEADER,
  NO_BRANCH_MARKER,
  NO_SCOPE_MARKER,
  ORG_SLUG_REQUEST_HEADER,
} from "@/lib/access/business-cookie";
import type { Permission } from "@/lib/access/permissions";
import type { Branch } from "@/lib/types/api";

export interface BusinessSummary {
  orgId: string;
  slug: string;
  name: string;
  businessType: string;
  imageUrl: string | null;
  roleKey: string | null;
  /** Null while the owner has not finished onboarding. */
  onboardingCompletedAt: string | null;
}

export interface AccessSnapshot {
  userId: string;
  roleKey: string | null;
  permissions: Permission[];
  /** Every business the user belongs to (drives the workspace switcher). */
  businesses: BusinessSummary[];
  /** The business this host is for (`<slug>.<root domain>`), if the user belongs to it. */
  activeBusinessId: string | null;
  activeBusinessSlug: string | null;
  /** Branches this member can see (all of them, or just their own). */
  branches: Pick<Branch, "id" | "name" | "code" | "isDefault" | "isActive">[];
  /** Branch the API resolved for this session (selected, default, or only). */
  activeBranchId: string | null;
  /** True when the member is limited to specific branches. */
  branchRestricted: boolean;
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

/**
 * Who am I, which businesses can I work in, and, on a workspace host, what may
 * I do there. The host names the business; if the user does not belong to it,
 * `activeBusinessId` is null and the page shows "no access". A stale branch
 * selection (deactivated, or no longer allowed) is ignored. The API stays the
 * authority and re-checks everything on every call.
 */
export const getAccess = actionClient.action(
  async (): Promise<AccessSnapshot> => {
    const slug = (await headers()).get(ORG_SLUG_REQUEST_HEADER);
    const selectedBranch = (await cookies()).get(BRANCH_COOKIE)?.value ?? null;

    const businesses = await backendApiClient
      // The list must not depend on which workspace host we are on.
      .get("auth/businesses", { headers: { [NO_SCOPE_MARKER]: "1" } })
      .json<BusinessSummary[]>();

    const active = slug ? businesses.find((b) => b.slug === slug) : undefined;

    // Branch list needs a business; members without `branch:read` (custom
    // roles) just get an empty list and use whatever branch the API resolves.
    let branches: AccessSnapshot["branches"] = [];
    if (active) {
      branches = await backendApiClient
        .get("branches", { headers: { [NO_BRANCH_MARKER]: "1" } })
        .json<Branch[]>()
        .catch(() => []);
    }

    const branchValid =
      !!selectedBranch &&
      branches.some((b) => b.id === selectedBranch && b.isActive);

    const me = await backendApiClient
      .get("auth/me", {
        headers: active
          ? branchValid
            ? { [BRANCH_HEADER]: selectedBranch }
            : { [NO_BRANCH_MARKER]: "1" }
          : { [NO_SCOPE_MARKER]: "1" },
      })
      .json<{
        userId: string;
        roleKey: string | null;
        permissions: Permission[];
        branchId: string | null;
        restrictedBranchIds: string[] | null;
      }>();

    return {
      userId: me.userId,
      roleKey: active ? me.roleKey : null,
      permissions: active ? me.permissions : [],
      businesses,
      activeBusinessId: active?.orgId ?? null,
      activeBusinessSlug: active?.slug ?? null,
      branches: branches.map(({ id, name, code, isDefault, isActive }) => ({
        id,
        name,
        code,
        isDefault,
        isActive,
      })),
      activeBranchId: active ? me.branchId : null,
      branchRestricted: me.restrictedBranchIds !== null,
    };
  },
);

export const setActiveBranch = actionClient
  .inputSchema(z.object({ branchId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    (await cookies()).set(BRANCH_COOKIE, parsedInput.branchId, cookieOptions);
    return { branchId: parsedInput.branchId };
  });
