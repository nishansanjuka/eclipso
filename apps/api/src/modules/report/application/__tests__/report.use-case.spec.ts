import { NotFoundException } from '@nestjs/common';
import { ReportUseCase } from '../report.use-case';

const BIZ = 'biz-1';
const K = 'branch-k';
const M = 'branch-m';

const branch = (id: string, name: string, isActive = true) => ({
  id,
  name,
  code: name.toUpperCase(),
  isActive,
  isDefault: false,
});

describe('ReportUseCase', () => {
  let repo: Record<string, jest.Mock>;
  let useCase: ReportUseCase;
  const owner = { businessId: BIZ, restrictedBranchIds: null };

  beforeEach(() => {
    repo = {
      listBranches: jest
        .fn()
        .mockResolvedValue([branch(K, 'Kottawa'), branch(M, 'Maharagama')]),
      salesByBranch: jest.fn(),
      refundsByBranch: jest.fn().mockResolvedValue(new Map()),
      series: jest.fn(),
      stockByBranch: jest.fn().mockResolvedValue([]),
      lowStock: jest.fn().mockResolvedValue([]),
    };
    useCase = new ReportUseCase(repo as any);
  });

  const sales = (revenue: string, salesCount: number) => ({
    salesCount,
    units: salesCount,
    gross: revenue,
    discount: '0',
    tax: '0',
    revenue,
  });

  describe('salesSummary', () => {
    it('breaks the period down per branch, totals it and compares to the previous period', async () => {
      repo.salesByBranch.mockImplementation((_b, range) => {
        const current = range.from.toISOString().startsWith('2026-03');
        return Promise.resolve(
          new Map([
            [K, sales(current ? '300.00' : '200.00', 3)],
            [M, sales(current ? '100.00' : '0', current ? 1 : 0)],
          ]),
        );
      });

      const r = await useCase.salesSummary(owner, {
        from: '2026-03-01',
        to: '2026-03-10',
      });

      expect(r.branches.map((b) => b.name)).toEqual(['Kottawa', 'Maharagama']);
      expect(r.branches[0]).toMatchObject({
        branchId: K,
        growthPercent: 50,
        current: { revenue: '300.00' },
        previous: { revenue: '200.00' },
      });
      // No prior revenue: growth is unknown, not infinite.
      expect(r.branches[1].growthPercent).toBeNull();
      expect(r.total.current.revenue).toBe('400.00');
      expect(r.total.previous.revenue).toBe('200.00');
      expect(r.total.growthPercent).toBe(100);
      expect(r.previousRange.to).toBe(r.range.from);
    });

    it('queries exactly the branches the caller may see, and shows zeros for quiet ones', async () => {
      repo.listBranches.mockResolvedValue([branch(K, 'Kottawa')]);
      repo.salesByBranch.mockResolvedValue(new Map());

      const limited = { businessId: BIZ, restrictedBranchIds: [K] };
      const r = await useCase.salesSummary(limited, {});

      expect(repo.listBranches).toHaveBeenCalledWith(BIZ, [K], undefined);
      for (const call of repo.salesByBranch.mock.calls) {
        expect(call[2]).toEqual([K]);
      }
      expect(r.branches).toHaveLength(1);
      expect(r.branches[0].current.revenue).toBe('0.00');
    });

    it('404s for a branch filter outside the caller scope', async () => {
      repo.listBranches.mockResolvedValue([]);
      await expect(
        useCase.salesSummary(
          { businessId: BIZ, restrictedBranchIds: [K] },
          { branchId: M },
        ),
      ).rejects.toThrow(NotFoundException);
      expect(repo.salesByBranch).not.toHaveBeenCalled();
    });
  });

  describe('salesSeries', () => {
    it('fills empty buckets and nets refunds per branch and in total', async () => {
      repo.series.mockResolvedValue({
        sales: [
          {
            branch_id: K,
            bucket: '2026-03-02',
            sales_count: 2,
            revenue: '50.00',
          },
          {
            branch_id: M,
            bucket: '2026-03-02',
            sales_count: 1,
            revenue: '10.00',
          },
          {
            branch_id: K,
            bucket: '2026-03-04',
            sales_count: 1,
            revenue: '5.00',
          },
        ],
        refunds: [{ branch_id: K, bucket: '2026-03-04', refunds: '8.00' }],
      });

      const r = await useCase.salesSeries(owner, {
        from: '2026-03-02',
        to: '2026-03-04',
        interval: 'day',
      });

      const k = r.series.find((s) => s.branchId === K)!;
      expect(k.points.map((p) => p.bucket)).toEqual([
        '2026-03-02',
        '2026-03-03',
        '2026-03-04',
      ]);
      expect(k.points.map((p) => p.netRevenue)).toEqual([
        '50.00',
        '0.00',
        '-3.00',
      ]);
      expect(r.total.map((p) => p.netRevenue)).toEqual([
        '60.00',
        '0.00',
        '-3.00',
      ]);
      expect(r.total[0].salesCount).toBe(3);
    });
  });

  describe('stock', () => {
    it('reports units and value per branch with a total, including empty branches', async () => {
      repo.stockByBranch.mockResolvedValue([
        { branch_id: K, products_in_stock: 3, units: 40, value_minor: '12050' },
      ]);

      const r = await useCase.stockSummary(owner, {});

      expect(r.branches.find((b) => b.branchId === M)).toMatchObject({
        units: 0,
        stockValue: '0.00',
      });
      expect(r.branches.find((b) => b.branchId === K)).toMatchObject({
        productsInStock: 3,
        units: 40,
        stockValue: '120.50',
      });
      expect(r.total).toEqual({ units: 40, stockValue: '120.50' });
    });

    it('low stock only looks at active branches', async () => {
      repo.listBranches.mockResolvedValue([
        branch(K, 'Kottawa'),
        branch(M, 'Closed', false),
      ]);
      repo.lowStock.mockResolvedValue([
        { branch_id: K, product_id: 'p1', name: 'Rice', sku: 'R1', qty: 0 },
      ]);

      const r = await useCase.lowStock(owner, { threshold: 5, limit: 50 });

      expect(repo.lowStock).toHaveBeenCalledWith(BIZ, [K], 5, 50);
      expect(r.items[0]).toMatchObject({ branchName: 'Kottawa', qty: 0 });
    });
  });
});
