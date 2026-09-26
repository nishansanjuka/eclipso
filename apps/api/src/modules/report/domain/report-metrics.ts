import {
  toDecimal,
  toMinor as toUnsignedMinor,
} from '../../sale/domain/sale-pricing';

/** Like `toMinor` but accepts a leading minus (net revenue can be negative). */
function toMinor(decimal: string): number {
  return decimal.startsWith('-')
    ? -toUnsignedMinor(decimal.slice(1))
    : toUnsignedMinor(decimal);
}

/** Parses a possibly negative decimal string into minor units. */
export const parseMinor = toMinor;

/** Raw per-branch aggregates as the database returns them (decimal strings). */
export interface RawSales {
  salesCount: number;
  units: number;
  gross: string;
  discount: string;
  tax: string;
  revenue: string;
}

export interface RawRefunds {
  refunds: string;
  returnedUnits: number;
}

export interface Metrics {
  salesCount: number;
  units: number;
  /** Before discounts and tax. */
  grossSales: string;
  discounts: string;
  tax: string;
  /** What customers paid (gross - discounts + tax). */
  revenue: string;
  refunds: string;
  returnedUnits: number;
  /** revenue - refunds. */
  netRevenue: string;
  /** revenue / salesCount. */
  averageSale: string;
}

export const EMPTY_SALES: RawSales = {
  salesCount: 0,
  units: 0,
  gross: '0',
  discount: '0',
  tax: '0',
  revenue: '0',
};
export const EMPTY_REFUNDS: RawRefunds = { refunds: '0', returnedUnits: 0 };

/** Money is summed in integer minor units so nothing drifts. */
export function buildMetrics(
  sales: RawSales = EMPTY_SALES,
  refunds: RawRefunds = EMPTY_REFUNDS,
): Metrics {
  const revenue = toMinor(sales.revenue);
  const refunded = toMinor(refunds.refunds);
  return {
    salesCount: sales.salesCount,
    units: sales.units,
    grossSales: toDecimal(toMinor(sales.gross)),
    discounts: toDecimal(toMinor(sales.discount)),
    tax: toDecimal(toMinor(sales.tax)),
    revenue: toDecimal(revenue),
    refunds: toDecimal(refunded),
    returnedUnits: refunds.returnedUnits,
    netRevenue: toDecimal(revenue - refunded),
    averageSale: toDecimal(
      sales.salesCount > 0 ? Math.round(revenue / sales.salesCount) : 0,
    ),
  };
}

/** Adds metrics together (used for the all-branches total). */
export function sumMetrics(parts: Metrics[]): Metrics {
  const sum = (pick: (m: Metrics) => string) =>
    parts.reduce((acc, m) => acc + toMinor(pick(m)), 0);
  const salesCount = parts.reduce((a, m) => a + m.salesCount, 0);
  const revenue = sum((m) => m.revenue);
  const refunds = sum((m) => m.refunds);
  return {
    salesCount,
    units: parts.reduce((a, m) => a + m.units, 0),
    grossSales: toDecimal(sum((m) => m.grossSales)),
    discounts: toDecimal(sum((m) => m.discounts)),
    tax: toDecimal(sum((m) => m.tax)),
    revenue: toDecimal(revenue),
    refunds: toDecimal(refunds),
    returnedUnits: parts.reduce((a, m) => a + m.returnedUnits, 0),
    netRevenue: toDecimal(revenue - refunds),
    averageSale: toDecimal(
      salesCount > 0 ? Math.round(revenue / salesCount) : 0,
    ),
  };
}

/**
 * Change in net revenue against the previous period, in percent to one
 * decimal. `null` when there is nothing to compare with (a percentage over a
 * zero base would be meaningless), so the UI can say "no prior data".
 */
export function growthPercent(current: Metrics, previous: Metrics) {
  const before = toMinor(previous.netRevenue);
  if (before <= 0) return null;
  const now = toMinor(current.netRevenue);
  return Math.round(((now - before) / before) * 1000) / 10;
}
