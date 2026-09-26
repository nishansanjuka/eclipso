/**
 * Display helpers for values that arrive from the API as decimal strings.
 * Formatting only: never calculate with these numbers.
 */
export function formatMoney(decimal: string | number): string {
  const n = typeof decimal === "number" ? decimal : Number(decimal);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

/** Local calendar date as YYYY-MM-DD (what the report API accepts). */
export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
