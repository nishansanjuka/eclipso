import { TeamPageClient } from "@/components/team/team-page-client";
import { PERMISSIONS } from "@/lib/access/permissions";
import { requirePagePermission } from "@/lib/access/require-page-permission";

export default async function TeamPage() {
  await requirePagePermission([
    PERMISSIONS.MEMBER_READ,
    PERMISSIONS.MEMBER_MANAGE,
  ]);
  return <TeamPageClient />;
}
