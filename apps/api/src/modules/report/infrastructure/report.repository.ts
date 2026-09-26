import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { type DrizzleClient } from '../../../shared/database/drizzle.module';
import { branches } from '../../branch/infrastructure/schema/branch.schema';
import { type DateRange, type Interval } from '../domain/report-range';
import { type RawRefunds, type RawSales } from '../domain/report-metrics';

/** Timestamps are stored in UTC; bind bounds as UTC too. */
const utc = (d: Date) =>
  sql`(${d.toISOString()}::timestamptz at time zone 'UTC')`;
const idList = (ids: string[]) =>
  sql.join(
    ids.map((id) => sql`${id}::uuid`),
    sql`, `,
  );

type SalesRow = {
  branch_id: string;
  sales_count: number;
  units: number;
  gross: string;
  discount: string;
  tax: string;
  revenue: string;
};
type RefundRow = {
  branch_id: string;
  refunds: string;
};
type ReturnedRow = {
  branch_id: string;
  returned_units: number;
};

/**
 * Read-only reporting queries. Every query is scoped by business AND an
 * explicit list of branch ids that the use case already limited to what the
 * caller may see, so a branch-limited member can never aggregate other
 * branches. Voided sales are excluded everywhere; rejected returns too.
 */
@Injectable()
export class ReportRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  /** Branches of the business, limited to `restricted` (null = all). */
  listBranches(
    businessId: string,
    restricted: readonly string[] | null,
    only?: string,
  ) {
    return this.db
      .select({
        id: branches.id,
        name: branches.name,
        code: branches.code,
        isActive: branches.isActive,
        isDefault: branches.isDefault,
      })
      .from(branches)
      .where(
        and(
          eq(branches.businessId, businessId),
          restricted ? inArray(branches.id, [...restricted]) : undefined,
          only ? eq(branches.id, only) : undefined,
        ),
      )
      .orderBy(desc(branches.isDefault), asc(branches.name));
  }

  async salesByBranch(
    businessId: string,
    range: DateRange,
    branchIds: string[],
  ): Promise<Map<string, RawSales>> {
    if (branchIds.length === 0) return new Map();
    const { rows } = await this.db.execute<SalesRow>(sql`
      select s.branch_id,
             count(*)::int as sales_count,
             coalesce(sum(s.qty), 0)::int as units,
             coalesce(sum(s.sub_total), 0)::text as gross,
             coalesce(sum(s.total_discount), 0)::text as discount,
             coalesce(sum(s.total_tax), 0)::text as tax,
             coalesce(sum(s.total_amount), 0)::text as revenue
        from sales s
       where s.business_id = ${businessId}::uuid
         and s.status = 'completed'
         and s.created_at >= ${utc(range.from)}
         and s.created_at < ${utc(range.to)}
         and s.branch_id in (${idList(branchIds)})
       group by s.branch_id`);
    return new Map(
      rows.map((r) => [
        r.branch_id,
        {
          salesCount: r.sales_count,
          units: r.units,
          gross: r.gross,
          discount: r.discount,
          tax: r.tax,
          revenue: r.revenue,
        },
      ]),
    );
  }

  /** Refunds are attributed to the branch of the sale, in the period they were paid out. */
  async refundsByBranch(
    businessId: string,
    range: DateRange,
    branchIds: string[],
  ): Promise<Map<string, RawRefunds>> {
    if (branchIds.length === 0) return new Map();
    const [refundRows, returnedRows] = await Promise.all([
      this.db.execute<RefundRow>(sql`
        select s.branch_id, coalesce(sum(r.amount), 0)::text as refunds
          from refunds r
          join returns rt on rt.id = r.return_id
          join sales s on s.id = rt.sale_id
         where s.business_id = ${businessId}::uuid
           and rt.status <> 'rejected'
           and r.created_at >= ${utc(range.from)}
           and r.created_at < ${utc(range.to)}
           and s.branch_id in (${idList(branchIds)})
         group by s.branch_id`),
      this.db.execute<ReturnedRow>(sql`
        select s.branch_id, coalesce(sum(ri.qty_returned), 0)::int as returned_units
          from return_items ri
          join returns rt on rt.id = ri.return_id
          join sales s on s.id = rt.sale_id
         where s.business_id = ${businessId}::uuid
           and rt.status <> 'rejected'
           and rt.created_at >= ${utc(range.from)}
           and rt.created_at < ${utc(range.to)}
           and s.branch_id in (${idList(branchIds)})
         group by s.branch_id`),
    ]);

    const out = new Map<string, RawRefunds>();
    for (const r of refundRows.rows) {
      out.set(r.branch_id, { refunds: r.refunds, returnedUnits: 0 });
    }
    for (const r of returnedRows.rows) {
      const current = out.get(r.branch_id) ?? {
        refunds: '0',
        returnedUnits: 0,
      };
      out.set(r.branch_id, { ...current, returnedUnits: r.returned_units });
    }
    return out;
  }

  /** Sales and refunds per branch per bucket ('YYYY-MM-DD' of the bucket start). */
  async series(
    businessId: string,
    range: DateRange,
    interval: Interval,
    branchIds: string[],
  ) {
    if (branchIds.length === 0) {
      return { sales: [], refunds: [] };
    }
    // `interval` is validated to one of three literals, never user text.
    const unit = sql.raw(`'${interval}'`);
    const [sales, refunds] = await Promise.all([
      this.db.execute<{
        branch_id: string;
        bucket: string;
        sales_count: number;
        revenue: string;
      }>(sql`
        select s.branch_id,
               to_char(date_trunc(${unit}, s.created_at), 'YYYY-MM-DD') as bucket,
               count(*)::int as sales_count,
               coalesce(sum(s.total_amount), 0)::text as revenue
          from sales s
         where s.business_id = ${businessId}::uuid
           and s.status = 'completed'
           and s.created_at >= ${utc(range.from)}
           and s.created_at < ${utc(range.to)}
           and s.branch_id in (${idList(branchIds)})
         group by 1, 2`),
      this.db.execute<{ branch_id: string; bucket: string; refunds: string }>(
        sql`
        select s.branch_id,
               to_char(date_trunc(${unit}, r.created_at), 'YYYY-MM-DD') as bucket,
               coalesce(sum(r.amount), 0)::text as refunds
          from refunds r
          join returns rt on rt.id = r.return_id
          join sales s on s.id = rt.sale_id
         where s.business_id = ${businessId}::uuid
           and rt.status <> 'rejected'
           and r.created_at >= ${utc(range.from)}
           and r.created_at < ${utc(range.to)}
           and s.branch_id in (${idList(branchIds)})
         group by 1, 2`,
      ),
    ]);
    return { sales: sales.rows, refunds: refunds.rows };
  }

  /** Units and stock value (qty x current price) on hand per branch. */
  async stockByBranch(businessId: string, branchIds: string[]) {
    if (branchIds.length === 0) return [];
    const { rows } = await this.db.execute<{
      branch_id: string;
      products_in_stock: number;
      units: number;
      value_minor: string;
    }>(sql`
      select bs.branch_id,
             count(*) filter (where bs.qty > 0)::int as products_in_stock,
             coalesce(sum(bs.qty), 0)::int as units,
             coalesce(sum(bs.qty::bigint * p.price), 0)::text as value_minor
        from branch_stock bs
        join products p on p.id = bs.product_id
       where p.business_id = ${businessId}::uuid
         and bs.branch_id in (${idList(branchIds)})
       group by bs.branch_id`);
    return rows;
  }

  /** Products at or below `threshold` in each (active) branch, emptiest first. */
  async lowStock(
    businessId: string,
    branchIds: string[],
    threshold: number,
    limit: number,
  ) {
    if (branchIds.length === 0) return [];
    const { rows } = await this.db.execute<{
      branch_id: string;
      product_id: string;
      name: string;
      sku: string;
      qty: number;
    }>(sql`
      select b.id as branch_id, p.id as product_id, p.name, p.sku,
             coalesce(bs.qty, 0)::int as qty
        from branches b
        join products p on p.business_id = b.business_id
        left join branch_stock bs on bs.branch_id = b.id and bs.product_id = p.id
       where b.business_id = ${businessId}::uuid
         and b.is_active
         and b.id in (${idList(branchIds)})
         and coalesce(bs.qty, 0) <= ${threshold}
       order by qty asc, p.name asc, b.name asc
       limit ${limit}`);
    return rows;
  }
}
