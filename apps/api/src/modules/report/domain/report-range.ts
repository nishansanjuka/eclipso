import { BadRequestException } from '@nestjs/common';

export interface DateRange {
  /** Inclusive start. */
  from: Date;
  /** Exclusive end. */
  to: Date;
}

export type Interval = 'day' | 'week' | 'month';

const DAY_MS = 86_400_000;
const DEFAULT_DAYS = 30;
const MAX_DAYS = 366;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function parse(value: string, name: string): { date: Date; dateOnly: boolean } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${name} must be an ISO date or date-time`);
  }
  return { date, dateOnly: DATE_ONLY.test(value) };
}

/**
 * Resolves the reporting window (UTC).
 *
 * - No bounds: the last 30 days up to now.
 * - A date-only `to` ("2026-03-31") includes that whole day, so the end
 *   becomes the start of the next day; a date-time `to` is used as given.
 * - The window must be non-empty and at most a year, which keeps report
 *   queries cheap and predictable.
 */
export function resolveRange(
  from?: string,
  to?: string,
  now: Date = new Date(),
): DateRange {
  let end = now;
  if (to) {
    const parsed = parse(to, 'to');
    end = parsed.dateOnly
      ? new Date(parsed.date.getTime() + DAY_MS)
      : parsed.date;
  }
  const start = from
    ? parse(from, 'from').date
    : new Date(end.getTime() - DEFAULT_DAYS * DAY_MS);

  if (start >= end) {
    throw new BadRequestException('`from` must be before `to`');
  }
  if (end.getTime() - start.getTime() > MAX_DAYS * DAY_MS) {
    throw new BadRequestException(
      `The reporting window can be at most ${MAX_DAYS} days`,
    );
  }
  return { from: start, to: end };
}

/** The window of equal length that ends where `range` starts. */
export function previousRange(range: DateRange): DateRange {
  const length = range.to.getTime() - range.from.getTime();
  return {
    from: new Date(range.from.getTime() - length),
    to: range.from,
  };
}

/** Start of the bucket containing `date` (UTC; weeks start on Monday). */
function bucketStart(date: Date, interval: Interval): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  if (interval === 'week') {
    const sinceMonday = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - sinceMonday);
  } else if (interval === 'month') {
    d.setUTCDate(1);
  }
  return d;
}

function nextBucket(date: Date, interval: Interval): Date {
  const d = new Date(date);
  if (interval === 'day') d.setUTCDate(d.getUTCDate() + 1);
  else if (interval === 'week') d.setUTCDate(d.getUTCDate() + 7);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

/** 'YYYY-MM-DD' keys for every bucket touching the range, matching SQL date_trunc. */
export function bucketKeys(range: DateRange, interval: Interval): string[] {
  const keys: string[] = [];
  const last = new Date(range.to.getTime() - 1);
  for (
    let b = bucketStart(range.from, interval);
    b <= last;
    b = nextBucket(b, interval)
  ) {
    keys.push(b.toISOString().slice(0, 10));
  }
  return keys;
}
