import z from 'zod';
import { BaseModel } from '../../../shared/zod/base.model';
import { Z } from '../../../shared/decorators/zod.validation';
import { CreateSaleDto, CreateSaleItemDto } from '../dto/sale.dto';
import { PaymentCreateEntity } from '../../payment/domain/payment.entity';

export class SaleItemCreateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string;

  @Z(z.string().nullable().optional())
  public readonly saleId?: string;

  @Z(z.string({ error: 'Invalid Product ID' }).min(1, 'Product ID is required'))
  public readonly productId: string;

  @Z(z.string().nullable().optional())
  public readonly discountId?: string;

  @Z(z.string().nullable().optional())
  public readonly taxId?: string;

  @Z(
    z
      .number({ error: 'Invalid quantity' })
      .min(1, 'Quantity must be at least 1'),
  )
  public readonly qty: number;

  @Z(
    z
      .string({ error: 'Invalid price' })
      .regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid decimal'),
  )
  public readonly price: string;

  constructor(params: CreateSaleItemDto) {
    super(params);
    this.id = params.id;
    this.saleId = params.saleId;
    this.productId = params.productId;
    this.discountId = params.discountId;
    this.taxId = params.taxId;
    this.qty = params.qty;
    this.price = params.price;
  }
}

export class SaleCreateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string;

  @Z(
    z
      .string({ error: 'Invalid Business ID' })
      .min(1, 'Business ID is required'),
  )
  public readonly businessId: string;

  @Z(z.string().nullable().optional())
  public readonly customerId?: string;

  @Z(
    z
      .string({ error: 'Invalid total amount' })
      .regex(/^\d+(\.\d{1,2})?$/, 'Total amount must be a valid decimal'),
  )
  public readonly totalAmount: string;

  @Z(
    z
      .number({ error: 'Invalid quantity' })
      .min(0, 'Quantity must be at least 0'),
  )
  public readonly qty: number;

  @Z(
    z
      .array(z.instanceof(SaleItemCreateEntity))
      .min(1, 'At least one sale item is required'),
  )
  public readonly items: SaleItemCreateEntity[];

  @Z(z.instanceof(PaymentCreateEntity).nullable().optional())
  public readonly payment?: PaymentCreateEntity;

  constructor(params: CreateSaleDto) {
    super(params);
    this.id = params.id;
    this.businessId = params.businessId;
    this.customerId = params.customerId;
    this.totalAmount = params.totalAmount;
    this.qty = params.qty;
    this.items = params.items.map((item) => new SaleItemCreateEntity(item));
    this.payment = params.payment
      ? new PaymentCreateEntity(params.payment)
      : undefined;
  }
}

export class SaleItemUpdateEntity extends BaseModel {
  @Z(z.string().optional())
  public readonly id?: string;

  @Z(z.string().optional())
  public readonly saleId?: string;

  @Z(z.string().optional())
  public readonly productId?: string;

  @Z(z.string().nullable().optional())
  public readonly discountId?: string;

  @Z(z.string().nullable().optional())
  public readonly taxId?: string;

  @Z(z.number({ error: 'Invalid quantity' }).min(1).optional())
  public readonly qty?: number;

  @Z(
    z
      .string({ error: 'Invalid price' })
      .regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid decimal')
      .optional(),
  )
  public readonly price?: string;

  constructor(params: Partial<CreateSaleItemDto>) {
    super(params);
    this.id = params.id;
    this.saleId = params.saleId;
    this.productId = params.productId;
    this.discountId = params.discountId;
    this.taxId = params.taxId;
    this.qty = params.qty;
    this.price = params.price;
  }
}

export class SaleUpdateEntity extends BaseModel {
  @Z(z.string().optional())
  public readonly id?: string;

  @Z(z.string().optional())
  public readonly businessId?: string;

  @Z(z.string().nullable().optional())
  public readonly customerId?: string;

  @Z(
    z
      .string({ error: 'Invalid total amount' })
      .regex(/^\d+(\.\d{1,2})?$/, 'Total amount must be a valid decimal')
      .optional(),
  )
  public readonly totalAmount?: string;

  @Z(z.number({ error: 'Invalid quantity' }).min(0).optional())
  public readonly qty?: number;

  @Z(z.array(z.instanceof(SaleItemUpdateEntity)).optional())
  public readonly items?: SaleItemUpdateEntity[];

  constructor(params: Partial<CreateSaleDto>) {
    super(params);
    this.id = params.id;
    this.businessId = params.businessId;
    this.customerId = params.customerId;
    this.totalAmount = params.totalAmount;
    this.qty = params.qty;
    this.items = params.items?.map((item) => new SaleItemUpdateEntity(item));
  }
}
