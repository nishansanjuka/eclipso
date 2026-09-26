"use server";

import ky from "ky";
import { z } from "zod";
import { actionClient, AppError } from "@/lib/action-client";
import { backendApiClient } from "@/lib/backend-api-client";
import { NO_SCOPE_MARKER } from "@/lib/access/business-cookie";
import type {
  Invitation,
  InvitationLookup,
  InvitationResult,
  Member,
  Role,
} from "@/lib/types/api";

const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:3000";

export const listMembers = actionClient.action(async () =>
  backendApiClient.get("auth/members").json<Member[]>(),
);

export const listRoles = actionClient.action(async () =>
  backendApiClient.get("auth/roles").json<Role[]>(),
);

export const listInvitations = actionClient.action(async () =>
  backendApiClient.get("invitations").json<Invitation[]>(),
);

export const createInvitations = actionClient
  .inputSchema(
    z.object({
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
      .post("invitations", { json: parsedInput })
      .json<{ results: InvitationResult[] }>(),
  );

export const resendInvitation = actionClient
  .inputSchema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) =>
    backendApiClient
      .post(`invitations/${parsedInput.id}/resend`)
      .json<{
        id: string;
        inviteUrl: string;
        emailSent: boolean;
        emailError?: string;
      }>(),
  );

export const revokeInvitation = actionClient
  .inputSchema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) =>
    backendApiClient
      .delete(`invitations/${parsedInput.id}`)
      .json<{ id: string }>(),
  );

/**
 * Joins the organisation from an invitation link. Sent without any workspace
 * scope: the invitee is not a member yet, that is the point of accepting.
 */
export const acceptInvitation = actionClient
  .inputSchema(z.object({ token: z.string().trim().max(100) }))
  .action(async ({ parsedInput }) =>
    backendApiClient
      .post("invitations/accept", {
        json: parsedInput,
        headers: { [NO_SCOPE_MARKER]: "1" },
      })
      .json<{ orgId: string; slug: string; organizationName: string }>(),
  );

/**
 * Public lookup for the invitation page (works signed out). Not an action:
 * called by the server component directly, no session involved.
 */
export async function lookupInvitation(
  token: string,
): Promise<InvitationLookup | null> {
  try {
    return await ky
      .get(`${API_BASE_URL}/public/invitations/${encodeURIComponent(token)}`, {
        timeout: 10_000,
      })
      .json<InvitationLookup>();
  } catch (error) {
    if (error instanceof AppError) return null;
    // ky throws HTTPError for 4xx: an unknown or malformed token is just "not found".
    if (error && typeof error === "object" && "response" in error) return null;
    throw error;
  }
}
