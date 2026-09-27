"use server";

import { z } from "zod";
import { actionClient } from "@/lib/action-client";
import { backendApiClient } from "@/lib/backend-api-client";
import {
  BRANCH_HEADER,
  NO_BRANCH_MARKER,
  NO_SCOPE_MARKER,
} from "@/lib/access/business-cookie";
import type {
  Branch,
  BusinessProfile,
  ImportResult,
  InvitationResult,
  Role,
} from "@/lib/types/api";

/**
 * Onboarding happens on the app host, before the workspace exists as an
 * address the user has visited, so every call names its business explicitly
 * (`X-Business-Id`). The API checks the caller is a member and holds the
 * permission, exactly as it does for a workspace host.
 */
const scope = (orgId: string, branchId?: string) => ({
  "x-business-id": orgId,
  ...(branchId ? { [BRANCH_HEADER]: branchId } : { [NO_BRANCH_MARKER]: "1" }),
});

const orgId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
const optional = (max: number) => z.string().trim().max(max).optional();

export const checkWorkspaceAddress = actionClient
  .inputSchema(z.object({ slug: z.string().trim().max(60) }))
  .action(async ({ parsedInput }) =>
    backendApiClient
      .get(`auth/slugs/${encodeURIComponent(parsedInput.slug)}`, {
        headers: { [NO_SCOPE_MARKER]: "1" },
      })
      .json<{
        slug: string;
        available: boolean;
        reason: "invalid" | "taken" | null;
      }>(),
  );

const profileFields = {
  registeredName: optional(150),
  registrationNumber: optional(60),
  phone: optional(30),
  country: z.string().trim().length(2).optional(),
  addressLine: optional(200),
  city: optional(80),
  postalCode: optional(20),
};

export const createBusiness = actionClient
  .inputSchema(
    z.object({
      name: z.string().trim().min(3).max(100),
      slug: z.string().trim().toLowerCase().optional(),
      businessType: z.enum(["retail", "service", "manufacturing"]),
      ...profileFields,
    }),
  )
  .action(async ({ parsedInput }) =>
    backendApiClient
      .post("auth/businesses", {
        json: parsedInput,
        headers: { [NO_SCOPE_MARKER]: "1" },
      })
      .json<{ orgId: string; slug: string; name: string }>(),
  );

/** Everything the wizard needs to resume: profile, stores and invitable roles. */
export const getOnboardingState = actionClient
  .inputSchema(z.object({ orgId }))
  .action(async ({ parsedInput }) => {
    const headers = scope(parsedInput.orgId);
    const [business, branches, roles] = await Promise.all([
      backendApiClient
        .get("auth/business", { headers })
        .json<BusinessProfile>(),
      backendApiClient.get("branches", { headers }).json<Branch[]>(),
      backendApiClient
        .get("auth/roles", { headers })
        .json<Role[]>()
        .catch(() => [] as Role[]),
    ]);
    return { business, branches, roles };
  });

export const saveBusiness = actionClient
  .inputSchema(
    z.object({
      orgId,
      name: z.string().trim().min(3).max(100).optional(),
      slug: z.string().trim().toLowerCase().optional(),
      businessType: z.enum(["retail", "service", "manufacturing"]).optional(),
      ...profileFields,
      vatRegistered: z.boolean().optional(),
      vatNumber: optional(40),
      vatRate: z.string().trim().optional(),
      currency: z.string().trim().length(3).optional(),
      rounding: z.enum(["none", "nearest_1", "nearest_5"]).optional(),
      onboardingCompleted: z.literal(true).optional(),
    }),
  )
  .action(async ({ parsedInput: { orgId: id, ...patch } }) =>
    backendApiClient
      .put("auth/business", { json: patch, headers: scope(id) })
      .json<BusinessProfile>(),
  );

export const saveStore = actionClient
  .inputSchema(
    z.object({
      orgId,
      /** Present = update that store; absent = create. */
      id: z.string().uuid().optional(),
      name: z.string().trim().min(2).max(100),
      code: z.string().trim().toUpperCase().optional(),
      address: optional(255),
      kind: z.enum(["store", "warehouse"]),
      registerCount: z.number().int().min(0).max(50),
    }),
  )
  .action(async ({ parsedInput: { orgId: business, id, ...fields } }) => {
    const headers = scope(business);
    if (id) {
      return backendApiClient
        .put(`branches/${id}`, {
          json: {
            name: fields.name,
            address: fields.address ?? null,
            registerCount: fields.registerCount,
          },
          headers,
        })
        .json<Branch>();
    }
    return backendApiClient
      .post("branches", {
        json: {
          name: fields.name,
          code: fields.code,
          address: fields.address,
          kind: fields.kind,
          registerCount: fields.registerCount,
        },
        headers,
      })
      .json<Branch>();
  });

export const importProducts = actionClient
  .inputSchema(
    z.object({
      orgId,
      branchId: z.string().uuid().optional(),
      rows: z.array(z.record(z.string(), z.unknown())).min(1).max(5000),
    }),
  )
  .action(async ({ parsedInput }) =>
    backendApiClient
      .post("product/import", {
        json: { rows: parsedInput.rows },
        headers: scope(parsedInput.orgId, parsedInput.branchId),
        timeout: 120_000,
      })
      .json<ImportResult>(),
  );

export const sendInvitations = actionClient
  .inputSchema(
    z.object({
      orgId,
      invitations: z
        .array(
          z.object({
            email: z.string().trim().toLowerCase().max(254),
            roleId: z.string().uuid(),
            branchIds: z.array(z.string().uuid()).optional(),
          }),
        )
        .min(1)
        .max(25),
    }),
  )
  .action(async ({ parsedInput }) =>
    backendApiClient
      .post("invitations", {
        json: { invitations: parsedInput.invitations },
        headers: scope(parsedInput.orgId),
      })
      .json<{ results: InvitationResult[] }>(),
  );
