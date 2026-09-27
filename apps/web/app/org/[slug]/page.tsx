import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { PERMISSIONS } from "@/lib/access/permissions";
import { requirePagePermission } from "@/lib/access/require-page-permission";
import { salesSummaryQueryOptions } from "@/lib/query-options/reports";
import { isoDate } from "@/lib/utils";

export default async function DashboardPage() {
  const access = await requirePagePermission([]);

  const queryClient = new QueryClient();
  if (access.permissions.includes(PERMISSIONS.REPORT_READ)) {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    await queryClient.prefetchQuery(
      salesSummaryQueryOptions({ from: isoDate(start), to: isoDate(today) }),
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardOverview />
    </HydrationBoundary>
  );
}
