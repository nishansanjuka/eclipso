"use client";

import { useQuery } from "@tanstack/react-query";
import { accessQueryOptions } from "@/lib/query-options/access";
import type { Permission } from "@/lib/access/permissions";

/**
 * Permission gate for UI. `can(p)` mirrors the API's `PermissionsGuard`:
 * pass a key (or several — ANY grants) and it returns false while loading, so
 * privileged UI never flashes. Presentation only; the API enforces.
 */
export function useAccess() {
  const { data, isLoading } = useQuery(accessQueryOptions);
  const granted = new Set<string>(data?.permissions ?? []);

  function can(permission: Permission | Permission[]): boolean {
    if (!data) return false;
    const wanted = Array.isArray(permission) ? permission : [permission];
    if (wanted.length === 0) return true;
    return wanted.some((p) => granted.has(p));
  }

  const branches = data?.branches ?? [];

  return {
    can,
    isLoading,
    roleKey: data?.roleKey ?? null,
    businesses: data?.businesses ?? [],
    activeBusinessId: data?.activeBusinessId ?? null,
    activeBusiness:
      data?.businesses.find((b) => b.orgId === data.activeBusinessId) ?? null,
    branches,
    activeBranchId: data?.activeBranchId ?? null,
    activeBranch: branches.find((b) => b.id === data?.activeBranchId) ?? null,
    branchRestricted: data?.branchRestricted ?? false,
  };
}
