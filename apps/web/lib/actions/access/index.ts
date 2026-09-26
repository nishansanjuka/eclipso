"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { actionClient } from "@/lib/action-client";
import { backendApiClient } from "@/lib/backend-api-client";
import {
  BRANCH_COOKIE,
  BRANCH_HEADER,
  BUSINESS_COOKIE,
  BUSINESS_HEADER,
  NO_BRANCH_MARKER,
  NO_SCOPE_MARKER,
} from "@/lib/access/business-cookie";
import type { Permission } from "@/lib/access/permissions";
import type { Branch } from "@/lib/types/api";

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
 * Who am I, which businesses and branches can I work in, and what may I do.
 * Stale selections (membership removed, branch deactivated) are ignored and
 * reported as "none selected" so the UI can pick a valid one; the API stays the
 * authority and re-checks everything on every call.
 */
export const getAccess = actionClient.action(
  async (): Promise<AccessSnapshot> => {
    const jar = await cookies();
    const selectedBusiness = jar.get(BUSINESS_COOKIE)?.value ?? null;
    const selectedBranch = jar.get(BRANCH_COOKIE)?.value ?? null;

    const businesses = await backendApiClient
      // The list must not depend on the (possibly stale) business selection.
      .get("auth/businesses", { headers: { [NO_SCOPE_MARKER]: "1" } })
      .json<BusinessSummary[]>();

    const businessValid =
      !!selectedBusiness &&
      businesses.some((b) => b.orgId === selectedBusiness);
    const businessHeaders: Record<string, string> = businessValid
      ? { [BUSINESS_HEADER]: selectedBusiness }
      : {};

    // Branch list needs a business; members without `branch:read` (custom
    // roles) just get an empty list and use whatever branch the API resolves.
    let branches: AccessSnapshot["branches"] = [];
    if (businessValid) {
      branches = await backendApiClient
        .get("branches", {
          headers: { ...businessHeaders, [NO_BRANCH_MARKER]: "1" },
        })
        .json<Branch[]>()
        .catch(() => []);
    }

    const branchValid =
      !!selectedBranch &&
      branches.some((b) => b.id === selectedBranch && b.isActive);

    const me = await backendApiClient
      .get("auth/me", {
        headers: {
          ...businessHeaders,
          ...(branchValid
            ? { [BRANCH_HEADER]: selectedBranch }
            : { [NO_BRANCH_MARKER]: "1" }),
        },
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
      roleKey: businessValid ? me.roleKey : null,
      permissions: businessValid ? me.permissions : [],
      businesses,
      activeBusinessId: businessValid ? selectedBusiness : null,
      branches: branches.map(({ id, name, code, isDefault, isActive }) => ({
        id,
        name,
        code,
        isDefault,
        isActive,
      })),
      activeBranchId: businessValid ? me.branchId : null,
      branchRestricted: me.restrictedBranchIds !== null,
    };
  },
);

export const setActiveBusiness = actionClient
  .inputSchema(z.object({ orgId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/) }))
  .action(async ({ parsedInput }) => {
    const jar = await cookies();
    jar.set(BUSINESS_COOKIE, parsedInput.orgId, cookieOptions);
    // Branches belong to a business: a branch chosen in another one is meaningless.
    jar.delete(BRANCH_COOKIE);
    return { orgId: parsedInput.orgId };
  });

export const setActiveBranch = actionClient
  .inputSchema(z.object({ branchId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    (await cookies()).set(BRANCH_COOKIE, parsedInput.branchId, cookieOptions);
    return { branchId: parsedInput.branchId };
  });
