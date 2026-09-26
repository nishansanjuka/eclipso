import { BranchesPageClient } from "@/components/branches/branches-page-client";
import { PERMISSIONS } from "@/lib/access/permissions";
import { requirePagePermission } from "@/lib/access/require-page-permission";

export default async function BranchesPage() {
  await requirePagePermission([
    PERMISSIONS.BRANCH_READ,
    PERMISSIONS.BRANCH_MANAGE,
  ]);
  return <BranchesPageClient />;
}
