"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { accessQueryOptions, ACCESS_QUERY_KEY } from "@/lib/query-options/access";
import { setActiveBusiness } from "@/lib/actions/access";

/**
 * Guarantees the session has an ACTIVE business.
 *
 * Every permission is business-scoped: the API only resolves them when a valid
 * `X-Business-Id` accompanies the request. A member who belongs to a business
 * but has none selected (first login, or the selected one was removed) would
 * otherwise see an empty app. When that happens this selects their first
 * business and refreshes. Renders nothing.
 */
export function EnsureActiveBusiness() {
  const { data } = useQuery(accessQueryOptions);
  const queryClient = useQueryClient();
  const router = useRouter();
  const selecting = useRef(false);

  useEffect(() => {
    if (!data || data.activeBusinessId || selecting.current) return;
    const first = data.businesses[0];
    if (!first) return;

    selecting.current = true;
    setActiveBusiness({ orgId: first.orgId })
      .then(() => queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEY }))
      .then(() => router.refresh())
      .catch(() => {
        selecting.current = false;
      });
  }, [data, queryClient, router]);

  return null;
}
