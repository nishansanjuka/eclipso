import z from 'zod';

const isoDate = z.string().trim().min(1).max(40).optional();

const branchId = z.string().uuid('branchId must be a UUID').optional();

/** Reporting window (UTC). See `resolveRange` for the exact rules. */
export const rangeQuerySchema = z.object({
  from: isoDate,
  to: isoDate,
  branchId,
});

export const seriesQuerySchema = rangeQuerySchema.extend({
  interval: z.enum(['day', 'week', 'month']).default('day'),
});

export const stockQuerySchema = z.object({ branchId });

export const lowStockQuerySchema = z.object({
  branchId,
  threshold: z.coerce.number().int().min(0).max(100_000).default(5),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
