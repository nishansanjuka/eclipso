import { ReportsPageClient } from "@/components/reports/reports-page-client";
import { PERMISSIONS } from "@/lib/access/permissions";
import { requirePagePermission } from "@/lib/access/require-page-permission";

export default async function ReportsPage() {
  await requirePagePermission([PERMISSIONS.REPORT_READ]);
  return <ReportsPageClient />;
}
