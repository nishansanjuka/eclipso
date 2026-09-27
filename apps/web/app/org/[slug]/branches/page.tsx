import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import { BranchesPageClient } from "@/components/branches/branches-page-client";
import { PERMISSIONS } from "@/lib/access/permissions";
import { requirePagePermission } from "@/lib/access/require-page-permission";
import { branchesQueryOptions } from "@/lib/query-options/branches";

export default async function BranchesPage() {
  await requirePagePermission([
    PERMISSIONS.BRANCH_READ,
    PERMISSIONS.BRANCH_MANAGE,
  ]);

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(branchesQueryOptions);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BranchesPageClient />
    </HydrationBoundary>
  );
}
