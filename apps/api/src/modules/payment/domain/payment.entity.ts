import z from 'zod';
import { BaseModel } from '../../../shared/zod/base.model';
import { Z } from '../../../shared/decorators/zod.validation';
import { CreatePaymentDto } from '../dto/payment.dto';
import {
  PaymentMethodEnum,
  PaymentStatusEnum,
} from '../infrastructure/enums/payment.enum';

export class PaymentCreateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string;

  @Z(z.string().nullable().optional())
  public readonly saleId?: string;

  @Z(z.nativeEnum(PaymentMethodEnum, { error: 'Invalid payment method' }))
  public readonly method: PaymentMethodEnum;

  @Z(
    z
      .string({ error: 'Invalid amount' })
      .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal'),
  )
  public readonly amount: string;

  @Z(z.nativeEnum(PaymentStatusEnum, { error: 'Invalid payment status' }))
  public readonly status: PaymentStatusEnum;

  @Z(z.string().nullable().optional())
  public readonly transactionRef?: string;

  constructor(params: CreatePaymentDto) {
    super(params);
    this.id = params.id;
    this.saleId = params.saleId;
    this.method = params.method;
    this.amount = params.amount;
    this.status = params.status;
    this.transactionRef = params.transactionRef;
  }
}

export class PaymentUpdateEntity extends BaseModel {
  @Z(z.string().optional())
  public readonly id?: string;

  @Z(z.string().optional())
  public readonly saleId?: string;

  @Z(
    z
      .nativeEnum(PaymentMethodEnum, { error: 'Invalid payment method' })
      .optional(),
  )
  public readonly method?: PaymentMethodEnum;

  @Z(
    z
      .string({ error: 'Invalid amount' })
      .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal')
      .optional(),
  )
  public readonly amount?: string;

  @Z(
    z
      .nativeEnum(PaymentStatusEnum, { error: 'Invalid payment status' })
      .optional(),
  )
  public readonly status?: PaymentStatusEnum;

  @Z(z.string().nullable().optional())
  public readonly transactionRef?: string;

  constructor(params: Partial<CreatePaymentDto>) {
    super(params);
    this.id = params.id;
    this.saleId = params.saleId;
    this.method = params.method;
    this.amount = params.amount;
    this.status = params.status;
    this.transactionRef = params.transactionRef;
  }
}
