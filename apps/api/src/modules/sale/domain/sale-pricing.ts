/**
 * Server-side sale pricing. All arithmetic is on integer minor units (cents) so
 * there is no floating-point drift; percentages use BigInt and round half up.
 *
 * Conventions (must match the rest of the API):
 *  - `products.price` is an integer in minor units (cents).
 *  - `numeric(_, 2)` columns (sale/payment/tax/discount amounts) are decimal
 *    strings in major units ("12.34").
 *  - Tax is exclusive: it is added on top of the price, after the line discount.
 */

export type RateKind = 'percentage' | 'fixed';

export interface PricedRule {
  type: RateKind;
  /** Decimal string: a percentage (e.g. "12.5") or a fixed amount in major units. */
  value: string;
}

export interface PricingLineInput {
  /** Unit price in minor units. */
  unitPriceMinor: number;
  qty: number;
  discount?: PricedRule | null;
  tax?: PricedRule | null;
}

export interface PricedLine {
  grossMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
}

export interface PricedSale {
  lines: PricedLine[];
  subTotalMinor: number;
  totalDiscountMinor: number;
  totalTaxMinor: number;
  totalMinor: number;
}

const DECIMAL = /^\d+(\.\d{1,2})?$/;
/** numeric(10,2) ceiling, in minor units. */
export const MAX_AMOUNT_MINOR = 9_999_999_999;

/** "12.34" -> 1234. Throws on anything that isn't a plain 0-2 dp decimal. */
export function toMinor(decimal: string): number {
  if (!DECIMAL.test(decimal)) {
    throw new Error(`Invalid amount: ${decimal}`);
  }
  const [whole, frac = ''] = decimal.split('.');
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'));
}

/** 1234 -> "12.34". */
export function toDecimal(minor: number): string {
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, '0');
  return `${sign}${whole}.${frac}`;
}

/** amount * percent / 100, rounded half up, exact (BigInt). */
export function percentOf(amountMinor: number, percent: string): number {
  if (!DECIMAL.test(percent)) throw new Error(`Invalid rate: ${percent}`);
  const [whole, frac = ''] = percent.split('.');
  const hundredths = BigInt(whole) * 100n + BigInt(frac.padEnd(2, '0'));
  const scaled = BigInt(amountMinor) * hundredths;
  return Number((scaled + 5000n) / 10000n);
}

function apply(rule: PricedRule, baseMinor: number): number {
  return rule.type === 'percentage'
    ? percentOf(baseMinor, rule.value)
    : toMinor(rule.value);
}

export function priceLine(input: PricingLineInput): PricedLine {
  const { unitPriceMinor, qty } = input;
  if (!Number.isInteger(unitPriceMinor) || unitPriceMinor < 0) {
    throw new Error('Unit price must be a non-negative integer');
  }
  if (!Number.isInteger(qty) || qty < 1) {
    throw new Error('Quantity must be a positive integer');
  }

  const grossMinor = unitPriceMinor * qty;

  // A discount can never push a line below zero.
  const discountMinor = input.discount
    ? Math.min(apply(input.discount, grossMinor), grossMinor)
    : 0;
  const netMinor = grossMinor - discountMinor;
  const taxMinor = input.tax ? apply(input.tax, netMinor) : 0;

  return {
    grossMinor,
    discountMinor,
    taxMinor,
    totalMinor: netMinor + taxMinor,
  };
}

export function priceSale(inputs: PricingLineInput[]): PricedSale {
  const lines = inputs.map(priceLine);
  const sum = (pick: (l: PricedLine) => number) =>
    lines.reduce((acc, l) => acc + pick(l), 0);

  const sale: PricedSale = {
    lines,
    subTotalMinor: sum((l) => l.grossMinor),
    totalDiscountMinor: sum((l) => l.discountMinor),
    totalTaxMinor: sum((l) => l.taxMinor),
    totalMinor: sum((l) => l.totalMinor),
  };

  if (
    sale.subTotalMinor > MAX_AMOUNT_MINOR ||
    sale.totalMinor > MAX_AMOUNT_MINOR
  ) {
    throw new Error('Sale total is too large');
  }
  return sale;
}
