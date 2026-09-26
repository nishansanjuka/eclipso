import { toMinor } from '../../sale/domain/sale-pricing';

export interface RefundableLine {
  price: string;
  qty: number;
  discountAmount: string;
  taxAmount: string;
}

/** What the customer actually paid for the whole line, in minor units. */
export function lineTotalMinor(line: RefundableLine): number {
  return (
    toMinor(line.price) * line.qty -
    toMinor(line.discountAmount) +
    toMinor(line.taxAmount)
  );
}

/**
 * Refund value of the first `units` units of a line: the line total (net of
 * discount, including tax) pro-rated, rounded half up on the cumulative
 * amount. Refunding `units` in one go or in several returns adds up to exactly
 * the same total, and returning every unit refunds exactly what was paid.
 */
export function cumulativeRefundMinor(
  line: RefundableLine,
  units: number,
): number {
  if (units <= 0) return 0;
  const total = BigInt(lineTotalMinor(line));
  const qty = BigInt(line.qty);
  return Number((total * BigInt(units) * 2n + qty) / (2n * qty));
}

/** Refund for returning `units` more, given `alreadyReturned` before. */
export function refundForReturnMinor(
  line: RefundableLine,
  alreadyReturned: number,
  units: number,
): number {
  return (
    cumulativeRefundMinor(line, alreadyReturned + units) -
    cumulativeRefundMinor(line, alreadyReturned)
  );
}
