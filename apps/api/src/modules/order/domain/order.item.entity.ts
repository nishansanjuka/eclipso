import z from 'zod';
import { Z } from '../../../shared/decorators/zod.validation';
import { BaseModel } from '../../../shared/zod/base.model';

export class OrderCreateEntity extends BaseModel {
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

  @Z(z.number({ error: 'Invalid tax' }).min(0, 'Tax must be positive'))
  public readonly tax: number;

  @Z(
    z.number({ error: 'Invalid discount' }).min(0, 'Discount must be positive'),
  )
  public readonly discount: number;

  constructor(params: OrderCreateEntity) {
    super(params);
    this.orderId = params.orderId;
    this.productId = params.productId;
    this.qty = params.qty;
    this.price = params.price;
    this.tax = params.tax;
    this.discount = params.discount;
  }
}
