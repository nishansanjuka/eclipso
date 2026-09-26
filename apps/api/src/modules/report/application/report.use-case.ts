import { Injectable, NotFoundException } from '@nestjs/common';
import { toDecimal } from '../../sale/domain/sale-pricing';
import { type AuthContext } from '../../auth/domain/auth-context';
import {
  bucketKeys,
  previousRange,
  resolveRange,
  type Interval,
} from '../domain/report-range';
import {
  buildMetrics,
  growthPercent,
  parseMinor,
  sumMetrics,
} from '../domain/report-metrics';
import { ReportRepository } from '../infrastructure/report.repository';

interface RangeQuery {
  from?: string;
  to?: string;
  branchId?: string;
}

type Actor = Pick<AuthContext, 'businessId' | 'restrictedBranchIds'>;

/**
 * Per-branch reporting for owners: every figure is broken down by branch and
 * rolled up into a business total, so growth of each location can be compared.
 *
 * A branch-limited member only ever sees their own branches: the branch list is
 * resolved from their scope first and every query runs on exactly that list.
 */
@Injectable()
export class ReportUseCase {
  constructor(private readonly repository: ReportRepository) {}

  /** Branches the caller may report on, optionally narrowed to one. */
  private async branchesFor(actor: Actor, branchId?: string) {
    const rows = await this.repository.listBranches(
      actor.businessId!,
      actor.restrictedBranchIds,
      branchId,
    );
    // Same answer for "no such branch" and "not yours".
    if (branchId && rows.length === 0) {
      throw new NotFoundException('Branch not found.');
    }
    return rows;
  }

  async salesSummary(actor: Actor, query: RangeQuery) {
    const range = resolveRange(query.from, query.to);
    const previous = previousRange(range);
    const branches = await this.branchesFor(actor, query.branchId);
    const ids = branches.map((b) => b.id);
    const businessId = actor.businessId!;

    const [sales, refunds, prevSales, prevRefunds] = await Promise.all([
      this.repository.salesByBranch(businessId, range, ids),
      this.repository.refundsByBranch(businessId, range, ids),
      this.repository.salesByBranch(businessId, previous, ids),
      this.repository.refundsByBranch(businessId, previous, ids),
    ]);

    const rows = branches.map((branch) => {
      const current = buildMetrics(
        sales.get(branch.id),
        refunds.get(branch.id),
      );
      const before = buildMetrics(
        prevSales.get(branch.id),
        prevRefunds.get(branch.id),
      );
      return {
        branchId: branch.id,
        name: branch.name,
        code: branch.code,
        isActive: branch.isActive,
        current,
        previous: before,
        growthPercent: growthPercent(current, before),
      };
    });

    const total = sumMetrics(rows.map((r) => r.current));
    const totalBefore = sumMetrics(rows.map((r) => r.previous));
    return {
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      previousRange: {
        from: previous.from.toISOString(),
        to: previous.to.toISOString(),
      },
      branches: rows,
      total: {
        current: total,
        previous: totalBefore,
        growthPercent: growthPercent(total, totalBefore),
      },
    };
  }

  async salesSeries(actor: Actor, query: RangeQuery & { interval: Interval }) {
    const range = resolveRange(query.from, query.to);
    const branches = await this.branchesFor(actor, query.branchId);
    const keys = bucketKeys(range, query.interval);
    const { sales, refunds } = await this.repository.series(
      actor.businessId!,
      range,
      query.interval,
      branches.map((b) => b.id),
    );

    type Cell = { salesCount: number; revenue: number; refunds: number };
    const cells = new Map<string, Cell>(); // `${branchId}|${bucket}`
    const cell = (branchId: string, bucket: string) => {
      const key = `${branchId}|${bucket}`;
      let c = cells.get(key);
      if (!c) cells.set(key, (c = { salesCount: 0, revenue: 0, refunds: 0 }));
      return c;
    };
    for (const r of sales) {
      const c = cell(r.branch_id, r.bucket);
      c.salesCount += r.sales_count;
      c.revenue += parseMinor(r.revenue);
    }
    for (const r of refunds) {
      cell(r.branch_id, r.bucket).refunds += parseMinor(r.refunds);
    }

    const point = (bucket: string, c: Cell) => ({
      bucket,
      salesCount: c.salesCount,
      revenue: toDecimal(c.revenue),
      refunds: toDecimal(c.refunds),
      netRevenue: toDecimal(c.revenue - c.refunds),
    });

    const series = branches.map((branch) => ({
      branchId: branch.id,
      name: branch.name,
      code: branch.code,
      points: keys.map((bucket) =>
        point(
          bucket,
          cells.get(`${branch.id}|${bucket}`) ?? {
            salesCount: 0,
            revenue: 0,
            refunds: 0,
          },
        ),
      ),
    }));

    const total = keys.map((bucket) => {
      const sum: Cell = { salesCount: 0, revenue: 0, refunds: 0 };
      for (const branch of branches) {
        const c = cells.get(`${branch.id}|${bucket}`);
        if (c) {
          sum.salesCount += c.salesCount;
          sum.revenue += c.revenue;
          sum.refunds += c.refunds;
        }
      }
      return point(bucket, sum);
    });

    return {
      interval: query.interval,
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      series,
      total,
    };
  }

  async stockSummary(actor: Actor, query: { branchId?: string }) {
    const branches = await this.branchesFor(actor, query.branchId);
    const rows = await this.repository.stockByBranch(
      actor.businessId!,
      branches.map((b) => b.id),
    );
    const byBranch = new Map(rows.map((r) => [r.branch_id, r]));

    const perBranch = branches.map((branch) => {
      const r = byBranch.get(branch.id);
      return {
        branchId: branch.id,
        name: branch.name,
        code: branch.code,
        isActive: branch.isActive,
        productsInStock: r?.products_in_stock ?? 0,
        units: r?.units ?? 0,
        // Stock value at today's selling price (not cost: products have no cost yet).
        stockValue: toDecimal(Number(r?.value_minor ?? 0)),
      };
    });

    return {
      branches: perBranch,
      total: {
        units: perBranch.reduce((a, b) => a + b.units, 0),
        stockValue: toDecimal(
          perBranch.reduce((a, b) => a + parseMinor(b.stockValue), 0),
        ),
      },
    };
  }

  async lowStock(
    actor: Actor,
    query: { branchId?: string; threshold: number; limit: number },
  ) {
    const branches = (await this.branchesFor(actor, query.branchId)).filter(
      (b) => b.isActive,
    );
    const nameOf = new Map(branches.map((b) => [b.id, b]));
    const rows = await this.repository.lowStock(
      actor.businessId!,
      branches.map((b) => b.id),
      query.threshold,
      query.limit,
    );
    return {
      threshold: query.threshold,
      items: rows.map((r) => ({
        branchId: r.branch_id,
        branchName: nameOf.get(r.branch_id)?.name ?? '',
        productId: r.product_id,
        name: r.name,
        sku: r.sku,
        qty: r.qty,
      })),
    };
  }
}
