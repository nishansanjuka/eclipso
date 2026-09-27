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
  PermissionCatalogEntry,
  Role,
  RolePermissionRequest,
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

export const listPermissionCatalog = actionClient.action(async () =>
  backendApiClient.get("auth/permissions").json<PermissionCatalogEntry[]>(),
);

export const assignMemberRole = actionClient
  .inputSchema(z.object({ userId: z.string(), roleId: z.string().uuid() }))
  .action(async ({ parsedInput }) =>
    backendApiClient
      .patch(`auth/members/${parsedInput.userId}/role`, {
        json: { roleId: parsedInput.roleId },
      })
      .json<{ userId: string; roleId: string }>(),
  );

export const banMember = actionClient
  .inputSchema(
    z.object({ userId: z.string(), reason: z.string().trim().max(255).nullish() }),
  )
  .action(async ({ parsedInput }) =>
    backendApiClient
      .post(`auth/members/${parsedInput.userId}/ban`, {
        json: { reason: parsedInput.reason ?? null },
      })
      .json<{ userId: string; isBanned: boolean }>(),
  );

export const unbanMember = actionClient
  .inputSchema(z.object({ userId: z.string() }))
  .action(async ({ parsedInput }) =>
    backendApiClient
      .post(`auth/members/${parsedInput.userId}/unban`)
      .json<{ userId: string; isBanned: boolean }>(),
  );

const roleShape = {
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().max(255).nullish(),
  permissions: z.array(z.string()),
};

export const createRole = actionClient
  .inputSchema(z.object(roleShape))
  .action(async ({ parsedInput }) =>
    backendApiClient.post("auth/roles", { json: parsedInput }).json<
      Role & { pendingRequest: RolePermissionRequest | null }
    >(),
  );

export const updateRole = actionClient
  .inputSchema(
    z.object({
      roleId: z.string().uuid(),
      name: roleShape.name.optional(),
      description: roleShape.description,
      permissions: roleShape.permissions.optional(),
    }),
  )
  .action(async ({ parsedInput: { roleId, ...body } }) =>
    backendApiClient.put(`auth/roles/${roleId}`, { json: body }).json<
      Role & { pendingRequest: RolePermissionRequest | null }
    >(),
  );

export const deleteRole = actionClient
  .inputSchema(z.object({ roleId: z.string().uuid() }))
  .action(async ({ parsedInput }) =>
    backendApiClient
      .delete(`auth/roles/${parsedInput.roleId}`)
      .json<{ id: string }>(),
  );

export const listPendingRoleRequests = actionClient.action(async () =>
  backendApiClient
    .get("auth/role-permission-requests")
    .json<RolePermissionRequest[]>(),
);

export const approveRoleRequest = actionClient
  .inputSchema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) =>
    backendApiClient
      .post(`auth/role-permission-requests/${parsedInput.id}/approve`)
      .json<{ id: string; status: string }>(),
  );

export const rejectRoleRequest = actionClient
  .inputSchema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) =>
    backendApiClient
      .post(`auth/role-permission-requests/${parsedInput.id}/reject`)
      .json<{ id: string; status: string }>(),
  );

export const setPermissionProtected = actionClient
  .inputSchema(z.object({ permissionId: z.string().uuid(), protected: z.boolean() }))
  .action(async ({ parsedInput }) =>
    backendApiClient
      .patch(`auth/permissions/${parsedInput.permissionId}/protect`, {
        json: { protected: parsedInput.protected },
      })
      .json<{ id: string; protected: boolean }>(),
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
