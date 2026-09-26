"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSignIcon,
  ReceiptIcon,
  RotateCcwIcon,
  ShoppingCartIcon,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { GrowthBadge } from "@/components/shared/growth-badge";
import { useAccess } from "@/hooks/use-access";
import { PERMISSIONS } from "@/lib/access/permissions";
import { salesSummaryQueryOptions } from "@/lib/query-options/reports";
import { formatMoney, formatNumber, isoDate } from "@/lib/utils";

/** Last 30 days at a glance; the full breakdown lives on the reports page. */
export function DashboardOverview() {
  const { can, isLoading: accessLoading } = useAccess();
  const allowed = can(PERMISSIONS.REPORT_READ);

  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 29);
  const { data, isLoading } = useQuery({
    ...salesSummaryQueryOptions({ from: isoDate(start), to: isoDate(today) }),
    enabled: allowed,
  });

  const total = data?.total;
  const loading = accessLoading || (allowed && isLoading);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {allowed
            ? "The last 30 days, compared with the 30 before."
            : "Sales and stock reports are not available for your role."}
        </p>
      </div>

      {allowed && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Net revenue"
              icon={DollarSignIcon}
              loading={loading}
              value={total ? formatMoney(total.current.netRevenue) : "—"}
              trend={
                total
                  ? {
                      percent: total.growthPercent,
                      label: "vs previous period",
                    }
                  : undefined
              }
            />
            <KpiCard
              title="Sales"
              icon={ShoppingCartIcon}
              loading={loading}
              value={total ? formatNumber(total.current.salesCount) : "—"}
            />
            <KpiCard
              title="Average sale"
              icon={ReceiptIcon}
              loading={loading}
              value={total ? formatMoney(total.current.averageSale) : "—"}
            />
            <KpiCard
              title="Refunds"
              icon={RotateCcwIcon}
              loading={loading}
              value={total ? formatMoney(total.current.refunds) : "—"}
            />
          </div>

          {data && data.branches.length > 1 && (
            <div className="rounded-xl border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Branches</h2>
                <Link
                  href="/reports"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Full report
                </Link>
              </div>
              <ul className="divide-y">
                {data.branches.map((b) => (
                  <li
                    key={b.branchId}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span className="font-medium">{b.name}</span>
                    <span className="flex items-center gap-3">
                      <span className="tabular-nums">
                        {formatMoney(b.current.netRevenue)}
                      </span>
                      <GrowthBadge percent={b.growthPercent} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
