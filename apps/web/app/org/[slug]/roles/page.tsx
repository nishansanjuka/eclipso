import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import { RolesPageClient } from "@/components/roles/roles-page-client";
import { PERMISSIONS } from "@/lib/access/permissions";
import { requirePagePermission } from "@/lib/access/require-page-permission";
import {
  pendingRoleRequestsQueryOptions,
  permissionCatalogQueryOptions,
  rolesQueryOptions,
} from "@/lib/query-options/team";

export default async function RolesPage() {
  const access = await requirePagePermission([
    PERMISSIONS.ROLE_READ,
    PERMISSIONS.ROLE_MANAGE,
  ]);

  const queryClient = new QueryClient();
  await Promise.allSettled([
    queryClient.prefetchQuery(rolesQueryOptions),
    queryClient.prefetchQuery(permissionCatalogQueryOptions),
    access.permissions.includes(PERMISSIONS.MANAGE_PROTECTIVE_PERMISSIONS)
      ? queryClient.prefetchQuery(pendingRoleRequestsQueryOptions)
      : Promise.resolve(),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RolesPageClient />
    </HydrationBoundary>
  );
}
