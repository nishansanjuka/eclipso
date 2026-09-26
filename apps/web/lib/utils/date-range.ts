import type { DateRange } from "react-day-picker";

/**
 * Turns a `DateRange` from the calendar into the `startDate` / `endDate` the
 * API expects.
 *
 * `react-day-picker` hands back local **midnight** for both ends. Sending
 * `to` unchanged as an inclusive upper bound excludes that entire day — pick
 * "Sep 1 – Sep 13" and everything filed on the 13th disappears, which reads as
 * a quiet day rather than as a filter bug. `rangeEnd` pushes it to the last
 * millisecond of the local day before serialising.
 */
export function toApiDateRange(range: DateRange | undefined): {
  startDate?: string;
  endDate?: string;
} {
  return {
    startDate: range?.from ? rangeStart(range.from).toISOString() : undefined,
    endDate: range?.to
      ? rangeEnd(range.to).toISOString()
      : // A single-day pick has `from` only. Without this the range is
        // open-ended and the "one day" the operator chose silently means
        // "that day and everything since".
        range?.from
        ? rangeEnd(range.from).toISOString()
        : undefined,
  };
}

/** First instant of the given local day. */
export function rangeStart(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/** Last instant of the given local day. */
export function rangeEnd(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

/** A `DateRange` covering the last `days` local days, today inclusive. */
export function lastNDays(days: number): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: rangeStart(from), to: rangeEnd(to) };
}
