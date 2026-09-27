import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import { SettingsPageClient } from "@/components/settings/settings-page-client";
import { PERMISSIONS } from "@/lib/access/permissions";
import { requirePagePermission } from "@/lib/access/require-page-permission";
import { businessProfileQueryOptions } from "@/lib/query-options/settings";

export default async function SettingsPage() {
  await requirePagePermission([PERMISSIONS.BUSINESS_MANAGE]);

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(businessProfileQueryOptions);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SettingsPageClient />
    </HydrationBoundary>
  );
}
