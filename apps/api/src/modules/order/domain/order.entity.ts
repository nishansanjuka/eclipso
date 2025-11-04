import z from 'zod';
import { Z } from '../../../shared/decorators/zod.validation';
import { BaseModel } from '../../../shared/zod/base.model';
import { OrderStatus } from '../infrastructure/enums/order.enum';
import { CreateOrderDto, UpdateOrderDto } from '../dto/order.dto';

export class OrderCreateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string;

  @Z(
    z
      .date({ error: 'Invalid expire date' })
      .min(new Date(), 'Expire date must be in the future'),
  )
  public readonly expectedDate: Date;

  @Z(
    z.enum(OrderStatus, {
      message: `Order status must be one of the following: ${Object.values(
        OrderStatus,
      ).join(', ')}`,
    }),
  )
  public readonly status: OrderStatus;

  @Z(
    z
      .number({ error: 'Invalid Total Amount' })
      .min(0, 'Total Amount must be positive'),
  )
  public readonly totalAmount: number;

  @Z(
    z
      .string({ error: 'Invalid Business Id' })
      .min(1, 'Business Id is required'),
  )
  public readonly businessId: string;

  @Z(
    z
      .string({ error: 'Invalid Supplier Id' })
      .min(1, 'Supplier Id is required'),
  )
  public readonly supplierId: string;

  @Z(z.string({ error: 'Invalid Invoice Id' }).min(1, 'Invoice Id is required'))
  public readonly invoiceId: string;

  constructor(params: CreateOrderDto) {
    super(params);
    this.businessId = params.businessId;
    this.supplierId = params.supplierId;
    this.expectedDate = params.expectedDate;
    this.status = params.status;
    this.totalAmount = params.totalAmount;
    this.invoiceId = params.invoiceId;
  }
}

export class OrderUpdateEntity extends BaseModel {
  @Z(
    z
      .date({ error: 'Invalid expire date' })
      .min(new Date(), 'Expire date must be in the future'),
  )
  public readonly expectedDate?: Date;

  @Z(
    z.enum(OrderStatus, {
      message: `Order status must be one of the following: ${Object.values(
        OrderStatus,
      ).join(', ')}`,
    }),
  )
  public readonly status?: OrderStatus;

  @Z(
    z
      .number({ error: 'Invalid Total Amount' })
      .min(0, 'Total Amount must be positive'),
  )
  public readonly totalAmount?: number;

  @Z(
    z
      .string({ error: 'Invalid Business Id' })
      .min(1, 'Business Id is required'),
  )
  public readonly businessId?: string;

  @Z(z.string({ error: 'Invalid Invoice Id' }).min(1, 'Invoice Id is required'))
  public readonly invoiceId?: string;

  constructor(params: UpdateOrderDto) {
    super(params);
    this.businessId = params.businessId;
    this.expectedDate = params.expectedDate;
    this.status = params.status;
  }
}
