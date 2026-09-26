"use server";

import { z } from "zod";
import { actionClient } from "@/lib/action-client";
import { backendApiClient } from "@/lib/backend-api-client";
import type {
  LowStock,
  SalesSeries,
  SalesSummary,
  StockSummary,
} from "@/lib/types/api";

const branchId = z.string().uuid().optional();
const date = z.string().max(40).optional();

/** Drops unset params so the API applies its own defaults. */
function params(input: Record<string, string | number | undefined>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined),
  ) as Record<string, string | number>;
}

export const getSalesSummary = actionClient
  .inputSchema(z.object({ from: date, to: date, branchId }))
  .action(async ({ parsedInput }) =>
    backendApiClient
      .get("reports/sales/summary", { searchParams: params(parsedInput) })
      .json<SalesSummary>(),
  );

export const getSalesSeries = actionClient
  .inputSchema(
    z.object({
      from: date,
      to: date,
      branchId,
      interval: z.enum(["day", "week", "month"]).optional(),
    }),
  )
  .action(async ({ parsedInput }) =>
    backendApiClient
      .get("reports/sales/series", { searchParams: params(parsedInput) })
      .json<SalesSeries>(),
  );

export const getStockSummary = actionClient
  .inputSchema(z.object({ branchId }))
  .action(async ({ parsedInput }) =>
    backendApiClient
      .get("reports/stock/summary", { searchParams: params(parsedInput) })
      .json<StockSummary>(),
  );

export const getLowStock = actionClient
  .inputSchema(
    z.object({
      branchId,
      threshold: z.number().int().min(0).max(100000).optional(),
      limit: z.number().int().min(1).max(200).optional(),
    }),
  )
  .action(async ({ parsedInput }) =>
    backendApiClient
      .get("reports/stock/low", { searchParams: params(parsedInput) })
      .json<LowStock>(),
  );
