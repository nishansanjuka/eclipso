"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSignIcon,
  ReceiptIcon,
  RotateCcwIcon,
  ShoppingCartIcon,
} from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ReusableTable, type Column } from "@/components/ui/reusable-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GrowthBadge } from "@/components/shared/growth-badge";
import { KpiCard } from "@/components/shared/kpi-card";
import { useAccess } from "@/hooks/use-access";
import {
  lowStockQueryOptions,
  salesSeriesQueryOptions,
  salesSummaryQueryOptions,
  stockSummaryQueryOptions,
} from "@/lib/query-options/reports";
import { formatMoney, formatNumber, isoDate } from "@/lib/utils";
import type {
  BranchSalesSummary,
  LowStock,
  SeriesInterval,
  StockSummary,
} from "@/lib/types/api";
import { useReportFilters, type ReportDays } from "@/stores";
import { cn } from "@/lib/utils";

const BRANCH_COLORS = [
  "#f2b42c",
  "#38bdf8",
  "#34d399",
  "#a78bfa",
  "#fb7185",
  "#f97316",
];

const DAY_OPTIONS: ReportDays[] = [7, 30, 90];
const INTERVALS: SeriesInterval[] = ["day", "week", "month"];

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
  label: (v: T) => string;
}) {
  return (
    <div className="flex items-center rounded-lg border border-border p-0.5">
      {options.map((opt) => (
        <button
          key={String(opt)}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            opt === value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label(opt)}
        </button>
      ))}
    </div>
  );
}

/** The last `days` days including today, as the API's date-only bounds. */
function rangeFor(days: number) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  return { from: isoDate(start), to: isoDate(today) };
}

export function ReportsPageClient() {
  const { branches } = useAccess();
  const { days, branch, interval, setDays, setBranch, setInterval } =
    useReportFilters();

  const range = useMemo(() => rangeFor(days), [days]);
  const branchId = branch === "all" ? undefined : branch;

  const summary = useQuery(salesSummaryQueryOptions({ ...range, branchId }));
  const series = useQuery(
    salesSeriesQueryOptions({ ...range, branchId, interval }),
  );
  const stock = useQuery(stockSummaryQueryOptions(branchId));
  const low = useQuery(lowStockQueryOptions(branchId));

  const total = summary.data?.total;
  const branchLabel = (id: string) =>
    id === "all"
      ? "All branches"
      : (branches.find((b) => b.id === id)?.name ?? id);

  // One row per bucket, one numeric column per branch (net revenue).
  const chart = useMemo(() => {
    const s = series.data;
    if (!s)
      return { rows: [], config: {} as ChartConfig, keys: [] as string[] };
    const config: ChartConfig = {};
    s.series.forEach((b, i) => {
      config[b.branchId] = {
        label: b.name,
        color: BRANCH_COLORS[i % BRANCH_COLORS.length],
      };
    });
    const rows = s.total.map((point, i) => {
      const row: Record<string, string | number> = { bucket: point.bucket };
      for (const b of s.series)
        row[b.branchId] = Number(b.points[i].netRevenue);
      return row;
    });
    return { rows, config, keys: s.series.map((b) => b.branchId) };
  }, [series.data]);

  const branchColumns: Column<BranchSalesSummary>[] = [
    {
      header: "Branch",
      accessorKey: "name",
      cell: (b) => (
        <div>
          <p className="font-medium">{b.name}</p>
          <p className="text-xs text-muted-foreground">
            {b.code}
            {!b.isActive && " · inactive"}
          </p>
        </div>
      ),
    },
    {
      header: "Sales",
      accessorKey: "current",
      className: "text-right",
      cell: (b) => formatNumber(b.current.salesCount),
    },
    {
      header: "Revenue",
      accessorKey: "current",
      className: "text-right",
      cell: (b) => formatMoney(b.current.revenue),
    },
    {
      header: "Refunds",
      accessorKey: "current",
      className: "text-right",
      cell: (b) => formatMoney(b.current.refunds),
    },
    {
      header: "Net revenue",
      accessorKey: "current",
      className: "text-right font-semibold",
      cell: (b) => formatMoney(b.current.netRevenue),
    },
    {
      header: "Growth",
      accessorKey: "growthPercent",
      className: "text-right",
      cell: (b) => <GrowthBadge percent={b.growthPercent} />,
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Sales and stock by branch. Growth compares with the previous {days}{" "}
            days.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {branches.length > 1 && (
            <Select value={branch} onValueChange={(v) => v && setBranch(v)}>
              <SelectTrigger className="min-w-40">
                <SelectValue>{(v: string) => branchLabel(v)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Segmented
            value={days}
            options={DAY_OPTIONS}
            onChange={setDays}
            label={(d) => `${d}d`}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Net revenue"
          icon={DollarSignIcon}
          loading={summary.isLoading}
          value={total ? formatMoney(total.current.netRevenue) : "—"}
          trend={
            total
              ? { percent: total.growthPercent, label: "vs previous period" }
              : undefined
          }
        />
        <KpiCard
          title="Sales"
          icon={ShoppingCartIcon}
          loading={summary.isLoading}
          value={total ? formatNumber(total.current.salesCount) : "—"}
          sub={total ? `${formatNumber(total.current.units)} units` : undefined}
        />
        <KpiCard
          title="Average sale"
          icon={ReceiptIcon}
          loading={summary.isLoading}
          value={total ? formatMoney(total.current.averageSale) : "—"}
        />
        <KpiCard
          title="Refunds"
          icon={RotateCcwIcon}
          loading={summary.isLoading}
          value={total ? formatMoney(total.current.refunds) : "—"}
          sub={
            total
              ? `${formatNumber(total.current.returnedUnits)} units returned`
              : undefined
          }
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Net revenue by branch</CardTitle>
          <Segmented
            value={interval}
            options={INTERVALS}
            onChange={setInterval}
            label={(i) => i}
          />
        </CardHeader>
        <CardContent>
          {series.isLoading ? (
            <div className="h-72 animate-pulse rounded-lg bg-muted" />
          ) : (
            <ChartContainer config={chart.config} className="h-72 w-full">
              <LineChart data={chart.rows} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="bucket"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickFormatter={(v: number) => formatNumber(v)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                {chart.keys.map((key) => (
                  <Line
                    key={key}
                    dataKey={key}
                    type="monotone"
                    stroke={`var(--color-${key})`}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-base font-semibold">Branch comparison</h2>
        <ReusableTable
          columns={branchColumns}
          data={summary.data?.branches ?? []}
          isLoading={summary.isLoading}
          getRowId={(b) => b.branchId}
          emptyMessage="No branches to report on."
        />
      </div>

      <StockSection
        stock={stock.data}
        low={low.data}
        loading={stock.isLoading}
      />
    </div>
  );
}

function StockSection({
  stock,
  low,
  loading,
}: {
  stock: StockSummary | undefined;
  low: LowStock | undefined;
  loading: boolean;
}) {
  const stockColumns: Column<StockSummary["branches"][number]>[] = [
    {
      header: "Branch",
      accessorKey: "name",
      cell: (b) => <span className="font-medium">{b.name}</span>,
    },
    {
      header: "Products in stock",
      accessorKey: "productsInStock",
      className: "text-right",
      cell: (b) => formatNumber(b.productsInStock),
    },
    {
      header: "Units",
      accessorKey: "units",
      className: "text-right",
      cell: (b) => formatNumber(b.units),
    },
    {
      header: "Stock value",
      accessorKey: "stockValue",
      className: "text-right",
      cell: (b) => formatMoney(b.stockValue),
    },
  ];

  const lowColumns: Column<LowStock["items"][number]>[] = [
    { header: "Product", accessorKey: "name", cell: (i) => i.name },
    { header: "SKU", accessorKey: "sku", cell: (i) => i.sku },
    { header: "Branch", accessorKey: "branchName", cell: (i) => i.branchName },
    {
      header: "In stock",
      accessorKey: "qty",
      className: "text-right",
      cell: (i) => (
        <span className={i.qty === 0 ? "font-semibold text-rose-500" : ""}>
          {formatNumber(i.qty)}
        </span>
      ),
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <h2 className="mb-2 text-base font-semibold">Stock on hand</h2>
        <ReusableTable
          columns={stockColumns}
          data={stock?.branches ?? []}
          isLoading={loading}
          getRowId={(b) => b.branchId}
          emptyMessage="No stock recorded yet."
        />
        {stock && (
          <p className="mt-2 text-xs text-muted-foreground">
            Total {formatNumber(stock.total.units)} units worth{" "}
            {formatMoney(stock.total.stockValue)} at selling price.
          </p>
        )}
      </div>
      <div>
        <h2 className="mb-2 text-base font-semibold">
          Running low (≤ {low?.threshold ?? 5})
        </h2>
        <ReusableTable
          columns={lowColumns}
          data={low?.items ?? []}
          isLoading={loading}
          getRowId={(i) => `${i.branchId}:${i.productId}`}
          emptyMessage="Nothing is running low."
        />
      </div>
    </div>
  );
}
