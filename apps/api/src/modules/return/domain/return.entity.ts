import z from 'zod';
import { BaseModel } from '../../../shared/zod/base.model';
import { Z } from '../../../shared/decorators/zod.validation';
import {
  CreateRefundDto,
  CreateReturnDto,
  CreateReturnItemDto,
} from '../dto/return.dto';
import {
  RefundMethodEnum,
  ReturnReasonEnum,
} from '../infrastructure/enums/return.enum';

const MAX_LINES = 200;

export class ReturnItemCreateEntity extends BaseModel {
  @Z(
    z
      .string({ error: 'Invalid Sale Item ID' })
      .uuid('Sale Item ID must be a valid UUID'),
  )
  public readonly saleItemId: string;

  @Z(
    z
      .number({ error: 'Invalid quantity' })
      .int('Quantity returned must be a whole number')
      .min(1, 'Quantity returned must be at least 1'),
  )
  public readonly qtyReturned: number;

  constructor(params: CreateReturnItemDto) {
    super(params);
    this.saleItemId = params.saleItemId;
    this.qtyReturned = params.qtyReturned;
  }
}

export class RefundCreateEntity extends BaseModel {
  @Z(z.nativeEnum(RefundMethodEnum, { error: 'Invalid refund method' }))
  public readonly method: RefundMethodEnum;

  @Z(z.string().max(255).nullable().optional())
  public readonly reason?: string | null;

  @Z(z.string().max(255).nullable().optional())
  public readonly transactionRef?: string | null;

  constructor(params: CreateRefundDto) {
    super(params);
    this.method = params.method;
    this.reason = params.reason;
    this.transactionRef = params.transactionRef;
  }
}

export class ReturnCreateEntity extends BaseModel {
  @Z(
    z.string({ error: 'Invalid Sale ID' }).uuid('Sale ID must be a valid UUID'),
  )
  public readonly saleId: string;

  @Z(z.nativeEnum(ReturnReasonEnum, { error: 'Invalid return reason' }))
  public readonly reason: ReturnReasonEnum;

  @Z(z.string().max(1000).nullable().optional())
  public readonly notes?: string | null;

  @Z(
    z
      .array(z.instanceof(ReturnItemCreateEntity))
      .min(1, 'At least one return item is required')
      .max(MAX_LINES, `A return can have at most ${MAX_LINES} lines`)
      .refine(
        (items) =>
          new Set(items.map((i) => i.saleItemId)).size === items.length,
        'Each sale item can appear only once per return',
      ),
  )
  public readonly items: ReturnItemCreateEntity[];

  @Z(z.instanceof(RefundCreateEntity).nullable().optional())
  public readonly refund?: RefundCreateEntity;

  constructor(params: CreateReturnDto) {
    const items = (params.items ?? []).map(
      (item) => new ReturnItemCreateEntity(item),
    );
    const refund = params.refund
      ? new RefundCreateEntity(params.refund)
      : undefined;
    super({ ...params, items, refund });
    this.saleId = params.saleId;
    this.reason = params.reason;
    this.notes = params.notes;
    this.items = items;
    this.refund = refund;
  }
}
