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
  ReturnStatusEnum,
} from '../infrastructure/enums/return.enum';

export class ReturnItemCreateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string;

  @Z(z.string().nullable().optional())
  public readonly returnId?: string;

  @Z(
    z
      .string({ error: 'Invalid Sale Item ID' })
      .min(1, 'Sale Item ID is required'),
  )
  public readonly saleItemId: string;

  @Z(
    z
      .number({ error: 'Invalid quantity' })
      .min(1, 'Quantity returned must be at least 1'),
  )
  public readonly qtyReturned: number;

  constructor(params: CreateReturnItemDto) {
    super(params);
    this.id = params.id;
    this.returnId = params.returnId;
    this.saleItemId = params.saleItemId;
    this.qtyReturned = params.qtyReturned;
  }
}

export class RefundCreateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string;

  @Z(z.string().nullable().optional())
  public readonly returnId?: string;

  @Z(z.string().nullable().optional())
  public readonly userId?: string;

  @Z(z.nativeEnum(RefundMethodEnum, { error: 'Invalid refund method' }))
  public readonly method: RefundMethodEnum;

  @Z(
    z
      .string({ error: 'Invalid amount' })
      .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal'),
  )
  public readonly amount: string;

  @Z(z.string().nullable().optional())
  public readonly reason?: string;

  @Z(z.string().nullable().optional())
  public readonly transactionRef?: string;

  constructor(params: CreateRefundDto) {
    super(params);
    this.id = params.id;
    this.returnId = params.returnId;
    this.userId = params.userId;
    this.method = params.method;
    this.amount = params.amount;
    this.reason = params.reason;
    this.transactionRef = params.transactionRef;
  }
}

export class ReturnCreateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string;

  @Z(z.string({ error: 'Invalid Sale ID' }).min(1, 'Sale ID is required'))
  public readonly saleId: string;

  @Z(z.string({ error: 'Invalid User ID' }).min(1, 'User ID is required'))
  public readonly userId: string;

  @Z(
    z
      .number({ error: 'Invalid quantity' })
      .min(1, 'Quantity must be at least 1'),
  )
  public readonly qty: number;

  @Z(z.nativeEnum(ReturnReasonEnum, { error: 'Invalid return reason' }))
  public readonly reason: ReturnReasonEnum;

  @Z(z.nativeEnum(ReturnStatusEnum, { error: 'Invalid return status' }))
  public readonly status: ReturnStatusEnum;

  @Z(z.string().nullable().optional())
  public readonly notes?: string;

  @Z(
    z
      .array(z.instanceof(ReturnItemCreateEntity))
      .min(1, 'At least one return item is required'),
  )
  public readonly items: ReturnItemCreateEntity[];

  @Z(z.instanceof(RefundCreateEntity).nullable().optional())
  public readonly refund?: RefundCreateEntity;

  constructor(params: CreateReturnDto) {
    super(params);
    this.id = params.id;
    this.saleId = params.saleId;
    this.userId = params.userId!;
    this.qty = params.qty;
    this.reason = params.reason;
    this.status = params.status;
    this.notes = params.notes;
    this.items = params.items.map((item) => new ReturnItemCreateEntity(item));
    this.refund = params.refund
      ? new RefundCreateEntity(params.refund)
      : undefined;
  }
}
