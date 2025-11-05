import z from 'zod';
import { Z } from '../../../shared/decorators/zod.validation';
import { BaseModel } from '../../../shared/zod/base.model';
import { CreateOrderItemDto, UpdateOrderItemDto } from '../dto/order-item.dto';

export class OrderItemCreateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string;

  @Z(z.string({ error: 'Invalid Order Id' }).min(1, 'Order Id is required'))
  public readonly orderId: string;

  @Z(
    z
      .string({ error: 'Invalid Supplier Id' })
      .min(1, 'Supplier Id is required'),
  )
  public readonly productId: string;

  @Z(
    z
      .number({ error: 'Invalid quantity' })
      .min(1, 'Quantity must be at least 1'),
  )
  public readonly qty: number;

  @Z(z.number({ error: 'Invalid price' }).min(0, 'Price must be positive'))
  public readonly price: number;

  constructor(params: CreateOrderItemDto) {
    super(params);
    this.orderId = params.orderId;
    this.productId = params.productId;
    this.qty = params.qty;
    this.price = params.price;
  }
}

export class OrderItemUpdateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string;

  @Z(z.number({ error: 'Invalid quantity' }).optional())
  public readonly qty?: number;

  @Z(z.number({ error: 'Invalid price' }).optional())
  public readonly price?: number;

  constructor(params: UpdateOrderItemDto) {
    super(params);
    this.qty = params.qty;
    this.price = params.price;
  }
}
