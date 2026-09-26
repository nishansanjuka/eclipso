import z from 'zod';
import { BaseModel } from '../../../shared/zod/base.model';
import { Z } from '../../../shared/decorators/zod.validation';
import { PaymentMethodEnum } from '../../payment/infrastructure/enums/payment.enum';
import {
  CreateSaleDto,
  CreateSaleItemDto,
  CreateSalePaymentDto,
  UpdateSaleDto,
} from '../dto/sale.dto';

const uuid = (label: string) =>
  z.string({ error: `Invalid ${label}` }).uuid(`${label} must be a valid UUID`);

const MAX_QTY_PER_LINE = 10_000;
const MAX_LINES = 200;

export class SaleItemCreateEntity extends BaseModel {
  @Z(uuid('Product ID'))
  public readonly productId: string;

  @Z(uuid('Discount ID').nullable().optional())
  public readonly discountId?: string | null;

  @Z(uuid('Tax ID').nullable().optional())
  public readonly taxId?: string | null;

  @Z(
    z
      .number({ error: 'Invalid quantity' })
      .int('Quantity must be a whole number')
      .min(1, 'Quantity must be at least 1')
      .max(MAX_QTY_PER_LINE, `Quantity must be at most ${MAX_QTY_PER_LINE}`),
  )
  public readonly qty: number;

  constructor(params: CreateSaleItemDto) {
    super(params);
    this.productId = params.productId;
    this.discountId = params.discountId;
    this.taxId = params.taxId;
    this.qty = params.qty;
  }
}

export class SalePaymentEntity extends BaseModel {
  @Z(z.nativeEnum(PaymentMethodEnum, { error: 'Invalid payment method' }))
  public readonly method: PaymentMethodEnum;

  @Z(
    z
      .string({ error: 'Invalid amount' })
      .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal'),
  )
  public readonly amount: string;

  @Z(z.string().max(255).nullable().optional())
  public readonly transactionRef?: string | null;

  constructor(params: CreateSalePaymentDto) {
    super(params);
    this.method = params.method;
    this.amount = params.amount;
    this.transactionRef = params.transactionRef;
  }
}

export class SaleCreateEntity extends BaseModel {
  @Z(uuid('Customer ID').nullable().optional())
  public readonly customerId?: string | null;

  @Z(
    z
      .array(z.instanceof(SaleItemCreateEntity))
      .min(1, 'At least one sale item is required')
      .max(MAX_LINES, `A sale can have at most ${MAX_LINES} lines`),
  )
  public readonly items: SaleItemCreateEntity[];

  @Z(z.instanceof(SalePaymentEntity).nullable().optional())
  public readonly payment?: SalePaymentEntity;

  constructor(params: CreateSaleDto) {
    const items = (params.items ?? []).map(
      (item) => new SaleItemCreateEntity(item),
    );
    const payment = params.payment
      ? new SalePaymentEntity(params.payment)
      : undefined;
    super({ ...params, items, payment });
    this.customerId = params.customerId;
    this.items = items;
    this.payment = payment;
  }
}

export class SaleUpdateEntity extends BaseModel {
  @Z(uuid('Customer ID').nullable().optional())
  public readonly customerId?: string | null;

  constructor(params: UpdateSaleDto) {
    super(params);
    this.customerId = params.customerId;
  }
}
