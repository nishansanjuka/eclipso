import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { type AuthUserObject } from '../../../../globals';
import { User } from '../../../shared/decorators/auth.decorator';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator';
import { parseBody } from '../../auth/dto/auth.dto';
import { PermissionType } from '../../auth/enums/auth-permissions.enum';
import { ReportUseCase } from '../application/report.use-case';
import {
  lowStockQuerySchema,
  rangeQuerySchema,
  seriesQuerySchema,
  stockQuerySchema,
} from '../dto/report.dto';

const RANGE_QUERIES = [
  {
    name: 'from',
    required: false,
    description:
      'Start (ISO date or date-time, UTC). Default: 30 days before `to`.',
  },
  {
    name: 'to',
    required: false,
    description:
      'End (ISO). A plain date includes that whole day. Default: now.',
  },
  {
    name: 'branchId',
    required: false,
    description: 'Limit to one branch. Default: every branch you may see.',
  },
] as const;

/**
 * Reports are broken down per branch and rolled up into a business total. A
 * member limited to some branches only sees those branches.
 */
@Controller('reports')
export class ReportController {
  constructor(private readonly useCase: ReportUseCase) {}

  @ApiOperation({
    operationId: 'getSalesSummaryReport',
    description:
      'Sales, refunds and net revenue per branch for a period, with the previous period of equal length and the growth in net revenue. Voided sales and rejected returns are excluded; refunds count in the period they were paid.',
  })
  @ApiQuery(RANGE_QUERIES[0])
  @ApiQuery(RANGE_QUERIES[1])
  @ApiQuery(RANGE_QUERIES[2])
  @RequirePermissions(PermissionType.REPORT_READ)
  @Get('sales/summary')
  salesSummary(@User() user: AuthUserObject, @Query() query: unknown) {
    return this.useCase.salesSummary(user, parseBody(rangeQuerySchema, query));
  }

  @ApiOperation({
    operationId: 'getSalesSeriesReport',
    description:
      'Net revenue over time per branch (and in total), bucketed by day, week (Monday) or month in UTC. Empty buckets are included as zeros.',
  })
  @ApiQuery(RANGE_QUERIES[0])
  @ApiQuery(RANGE_QUERIES[1])
  @ApiQuery(RANGE_QUERIES[2])
  @ApiQuery({
    name: 'interval',
    required: false,
    enum: ['day', 'week', 'month'],
  })
  @RequirePermissions(PermissionType.REPORT_READ)
  @Get('sales/series')
  salesSeries(@User() user: AuthUserObject, @Query() query: unknown) {
    return this.useCase.salesSeries(user, parseBody(seriesQuerySchema, query));
  }

  @ApiOperation({
    operationId: 'getStockSummaryReport',
    description:
      'Units on hand and stock value (at current selling price) per branch, with a business total.',
  })
  @ApiQuery(RANGE_QUERIES[2])
  @RequirePermissions(PermissionType.REPORT_READ)
  @Get('stock/summary')
  stockSummary(@User() user: AuthUserObject, @Query() query: unknown) {
    return this.useCase.stockSummary(user, parseBody(stockQuerySchema, query));
  }

  @ApiOperation({
    operationId: 'getLowStockReport',
    description:
      'Products at or below a stock threshold in each active branch, emptiest first.',
  })
  @ApiQuery(RANGE_QUERIES[2])
  @ApiQuery({ name: 'threshold', required: false, description: 'Default 5.' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Default 50, max 200.',
  })
  @RequirePermissions(PermissionType.REPORT_READ)
  @Get('stock/low')
  lowStock(@User() user: AuthUserObject, @Query() query: unknown) {
    return this.useCase.lowStock(user, parseBody(lowStockQuerySchema, query));
  }
}
