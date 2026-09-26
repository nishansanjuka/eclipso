import { bucketKeys, previousRange, resolveRange } from '../report-range';
import { buildMetrics, growthPercent, sumMetrics } from '../report-metrics';

const NOW = new Date('2026-03-15T10:00:00.000Z');

describe('resolveRange', () => {
  it('defaults to the last 30 days ending now', () => {
    const r = resolveRange(undefined, undefined, NOW);
    expect(r.to).toEqual(NOW);
    expect(r.to.getTime() - r.from.getTime()).toBe(30 * 86_400_000);
  });

  it('includes the whole last day when `to` is a plain date', () => {
    const r = resolveRange('2026-03-01', '2026-03-31', NOW);
    expect(r.from.toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(r.to.toISOString()).toBe('2026-04-01T00:00:00.000Z');
  });

  it('uses a date-time `to` exactly as given', () => {
    const r = resolveRange('2026-03-01', '2026-03-10T12:00:00Z', NOW);
    expect(r.to.toISOString()).toBe('2026-03-10T12:00:00.000Z');
  });

  it('rejects garbage, empty and oversized windows', () => {
    expect(() => resolveRange('nope', undefined, NOW)).toThrow(/ISO/);
    expect(() => resolveRange('2026-03-10', '2026-03-05', NOW)).toThrow(
      /before/,
    );
    expect(() => resolveRange('2024-01-01', '2026-01-01', NOW)).toThrow(
      /at most 366/,
    );
  });
});

describe('previousRange', () => {
  it('is the equal-length window ending where the range starts', () => {
    const r = resolveRange('2026-03-11', '2026-03-20', NOW); // 10 days
    const p = previousRange(r);
    expect(p.to).toEqual(r.from);
    expect(p.to.getTime() - p.from.getTime()).toBe(
      r.to.getTime() - r.from.getTime(),
    );
  });
});

describe('bucketKeys', () => {
  const range = resolveRange('2026-03-02', '2026-03-16', NOW);

  it('lists every day', () => {
    const keys = bucketKeys(range, 'day');
    expect(keys[0]).toBe('2026-03-02');
    expect(keys.at(-1)).toBe('2026-03-16');
    expect(keys).toHaveLength(15);
  });

  it('starts weeks on Monday, like date_trunc', () => {
    // 2026-03-02 is a Monday; 03-15 is a Sunday of the 03-09 week; 03-16 is Monday.
    expect(bucketKeys(range, 'week')).toEqual([
      '2026-03-02',
      '2026-03-09',
      '2026-03-16',
    ]);
    // A range starting mid-week is aligned back to that week's Monday.
    expect(
      bucketKeys(resolveRange('2026-03-04', '2026-03-05', NOW), 'week'),
    ).toEqual(['2026-03-02']);
  });

  it('lists months, including partial ones at the edges', () => {
    const r = resolveRange('2026-01-20', '2026-03-05', NOW);
    expect(bucketKeys(r, 'month')).toEqual([
      '2026-01-01',
      '2026-02-01',
      '2026-03-01',
    ]);
  });
});

describe('metrics', () => {
  const sales = (revenue: string, count: number) => ({
    salesCount: count,
    units: count * 2,
    gross: revenue,
    discount: '0',
    tax: '0',
    revenue,
  });

  it('nets refunds off revenue in exact minor units', () => {
    const m = buildMetrics(sales('100.10', 3), {
      refunds: '20.05',
      returnedUnits: 1,
    });
    expect(m.revenue).toBe('100.10');
    expect(m.refunds).toBe('20.05');
    expect(m.netRevenue).toBe('80.05');
    expect(m.averageSale).toBe('33.37');
    expect(m.returnedUnits).toBe(1);
  });

  it('handles a period with refunds but no sales (negative net)', () => {
    const m = buildMetrics(undefined, { refunds: '5.00', returnedUnits: 1 });
    expect(m.netRevenue).toBe('-5.00');
    expect(m.averageSale).toBe('0.00');
    // Summing and growth must cope with the minus sign.
    const total = sumMetrics([m, buildMetrics(sales('12.00', 1))]);
    expect(total.netRevenue).toBe('7.00');
  });

  it('sums branches into a total', () => {
    const total = sumMetrics([
      buildMetrics(sales('10.00', 1)),
      buildMetrics(sales('30.00', 3)),
    ]);
    expect(total).toMatchObject({
      salesCount: 4,
      revenue: '40.00',
      averageSale: '10.00',
    });
  });

  it('reports growth to one decimal, or null with no prior data', () => {
    const prev = buildMetrics(sales('200.00', 2));
    expect(growthPercent(buildMetrics(sales('250.00', 2)), prev)).toBe(25);
    expect(growthPercent(buildMetrics(sales('150.00', 2)), prev)).toBe(-25);
    expect(growthPercent(buildMetrics(sales('233.33', 2)), prev)).toBe(16.7);
    expect(growthPercent(buildMetrics(sales('10.00', 1)), buildMetrics())).toBe(
      null,
    );
  });
});
