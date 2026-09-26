import "server-only";
import { notFound } from "next/navigation";
import { getAccess } from "@/lib/actions/access";
import type { Permission } from "@/lib/access/permissions";

/**
 * Server-side page guard, the counterpart of the sidebar filter: a member who
 * lacks every listed permission gets a 404 instead of an empty shell. Pass no
 * permissions to only require a selected business.
 */
export async function requirePagePermission(permissions: Permission[]) {
  const result = await getAccess();
  const access = result?.data;
  if (!access?.activeBusinessId) notFound();
  if (
    permissions.length > 0 &&
    !permissions.some((p) => access.permissions.includes(p))
  ) {
    notFound();
  }
  return access;
}
