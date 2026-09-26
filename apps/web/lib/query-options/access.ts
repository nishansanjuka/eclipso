import { queryOptions } from "@tanstack/react-query";
import { getAccess } from "@/lib/actions/access";
import { handleActionResponse } from "@/lib/action-client";

export const ACCESS_QUERY_KEY = ["access"] as const;

/**
 * Identity, businesses and permissions for the selected business. Shared by the
 * dashboard layout (server prefetch) and `useAccess` (client) so the sidebar
 * resolves on first paint. The API stays the authority; this only shapes UI.
 */
export const accessQueryOptions = queryOptions({
  queryKey: ACCESS_QUERY_KEY,
  queryFn: async () => {
    const response = handleActionResponse(await getAccess());
    if (!response.success) {
      throw new Error(response.error.message || "Failed to load access");
    }
    return response.data;
  },
  staleTime: 60 * 1000,
});
