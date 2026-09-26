import { queryOptions } from "@tanstack/react-query";
import { handleActionResponse } from "@/lib/action-client";
import { listInvitations, listMembers, listRoles } from "@/lib/actions/team";

function unwrap<T>(result: Parameters<typeof handleActionResponse<T>>[0]) {
  const response = handleActionResponse(result);
  if (!response.success) throw new Error(response.error.message);
  return response.data;
}

export const membersQueryOptions = queryOptions({
  queryKey: ["team", "members"],
  queryFn: async () => unwrap(await listMembers()),
  staleTime: 30 * 1000,
});

export const invitationsQueryOptions = queryOptions({
  queryKey: ["team", "invitations"],
  queryFn: async () => unwrap(await listInvitations()),
  staleTime: 15 * 1000,
});

export const rolesQueryOptions = queryOptions({
  queryKey: ["team", "roles"],
  queryFn: async () => unwrap(await listRoles()),
  staleTime: 60 * 1000,
});
