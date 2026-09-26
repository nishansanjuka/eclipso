import { queryOptions } from "@tanstack/react-query";
import { listBranches } from "@/lib/actions/branches";
import { handleActionResponse } from "@/lib/action-client";

export const branchesQueryOptions = queryOptions({
  queryKey: ["branches"],
  queryFn: async () => {
    const response = handleActionResponse(await listBranches());
    if (!response.success) throw new Error(response.error.message);
    return response.data;
  },
  staleTime: 60 * 1000,
});
