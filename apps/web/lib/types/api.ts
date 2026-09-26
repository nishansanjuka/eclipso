/**
 * Response shapes of apps/api used by the UI. Hand-written until the generated
 * client (packages/api-client-ts) is regenerated for the new endpoints.
 */

export interface Branch {
  id: string;
  businessId: string;
  code: string;
  name: string;
  address: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Money is a decimal string ("12.34"); never do arithmetic on it in floats. */
export interface Metrics {
  salesCount: number;
  units: number;
  grossSales: string;
  discounts: string;
  tax: string;
  revenue: string;
  refunds: string;
  returnedUnits: number;
  netRevenue: string;
  averageSale: string;
}

export interface BranchSalesSummary {
  branchId: string;
  name: string;
  code: string;
  isActive: boolean;
  current: Metrics;
  previous: Metrics;
  /** Change in net revenue vs the previous period; null with no prior data. */
  growthPercent: number | null;
}

export interface SalesSummary {
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  branches: BranchSalesSummary[];
  total: {
    current: Metrics;
    previous: Metrics;
    growthPercent: number | null;
  };
}

export type SeriesInterval = "day" | "week" | "month";

export interface SeriesPoint {
  bucket: string;
  salesCount: number;
  revenue: string;
  refunds: string;
  netRevenue: string;
}

export interface SalesSeries {
  interval: SeriesInterval;
  range: { from: string; to: string };
  series: {
    branchId: string;
    name: string;
    code: string;
    points: SeriesPoint[];
  }[];
  total: SeriesPoint[];
}

export interface StockSummary {
  branches: {
    branchId: string;
    name: string;
    code: string;
    isActive: boolean;
    productsInStock: number;
    units: number;
    stockValue: string;
  }[];
  total: { units: number; stockValue: string };
}

export interface LowStock {
  threshold: number;
  items: {
    branchId: string;
    branchName: string;
    productId: string;
    name: string;
    sku: string;
    qty: number;
  }[];
}
