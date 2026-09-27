import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import { TeamPageClient } from "@/components/team/team-page-client";
import { PERMISSIONS } from "@/lib/access/permissions";
import { requirePagePermission } from "@/lib/access/require-page-permission";
import {
  invitationsQueryOptions,
  membersQueryOptions,
  rolesQueryOptions,
} from "@/lib/query-options/team";

export default async function TeamPage() {
  await requirePagePermission([
    PERMISSIONS.MEMBER_READ,
    PERMISSIONS.MEMBER_MANAGE,
  ]);

  const queryClient = new QueryClient();
  await Promise.allSettled([
    queryClient.prefetchQuery(membersQueryOptions),
    queryClient.prefetchQuery(invitationsQueryOptions),
    queryClient.prefetchQuery(rolesQueryOptions),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeamPageClient />
    </HydrationBoundary>
  );
}
