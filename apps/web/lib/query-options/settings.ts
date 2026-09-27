import { queryOptions } from "@tanstack/react-query";
import { handleActionResponse } from "@/lib/action-client";
import { getBusinessProfile } from "@/lib/actions/settings";

export const businessProfileQueryOptions = queryOptions({
  queryKey: ["settings", "business-profile"],
  queryFn: async () => {
    const response = handleActionResponse(await getBusinessProfile());
    if (!response.success) throw new Error(response.error.message);
    return response.data;
  },
  staleTime: 30 * 1000,
});
