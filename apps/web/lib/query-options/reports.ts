import { queryOptions } from "@tanstack/react-query";
import {
  getLowStock,
  getSalesSeries,
  getSalesSummary,
  getStockSummary,
} from "@/lib/actions/reports";
import { handleActionResponse } from "@/lib/action-client";
import type { SeriesInterval } from "@/lib/types/api";

export interface ReportRange {
  from?: string;
  to?: string;
  branchId?: string;
}

function unwrap<T>(result: Parameters<typeof handleActionResponse<T>>[0]) {
  const response = handleActionResponse(result);
  if (!response.success) throw new Error(response.error.message);
  return response.data;
}

export const salesSummaryQueryOptions = (range: ReportRange) =>
  queryOptions({
    queryKey: ["reports", "sales-summary", range],
    queryFn: async () => unwrap(await getSalesSummary(range)),
    staleTime: 60 * 1000,
  });

export const salesSeriesQueryOptions = (
  range: ReportRange & { interval: SeriesInterval },
) =>
  queryOptions({
    queryKey: ["reports", "sales-series", range],
    queryFn: async () => unwrap(await getSalesSeries(range)),
    staleTime: 60 * 1000,
  });

export const stockSummaryQueryOptions = (branchId?: string) =>
  queryOptions({
    queryKey: ["reports", "stock-summary", branchId ?? "all"],
    queryFn: async () => unwrap(await getStockSummary({ branchId })),
    staleTime: 60 * 1000,
  });

export const lowStockQueryOptions = (branchId?: string) =>
  queryOptions({
    queryKey: ["reports", "low-stock", branchId ?? "all"],
    queryFn: async () => unwrap(await getLowStock({ branchId, limit: 20 })),
    staleTime: 60 * 1000,
  });
