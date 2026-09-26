import z from 'zod';
import { BaseModel } from '../../../shared/zod/base.model';
import { Z } from '../../../shared/decorators/zod.validation';
import { CreateOrderItemDto, UpdateOrderItemDto } from '../dto/order-item.dto';

const MAX_QTY = 1_000_000;
// products.price / order_items.price are int4 minor units.
const MAX_PRICE = 2_000_000_000;

const qty = z
  .number({ error: 'Invalid quantity' })
  .int('Quantity must be a whole number')
  .min(1, 'Quantity must be at least 1')
  .max(MAX_QTY, `Quantity must be at most ${MAX_QTY}`);

const price = z
  .number({ error: 'Invalid price' })
  .int('Price must be a whole number of minor units')
  .min(0, 'Price must not be negative')
  .max(MAX_PRICE, 'Price is too large');

export class OrderItemCreateEntity extends BaseModel {
  @Z(z.string({ error: 'Invalid Order Id' }).uuid('Order Id must be a UUID'))
  public readonly orderId: string;

  @Z(
    z
      .string({ error: 'Invalid Product Id' })
      .uuid('Product Id must be a valid UUID'),
  )
  public readonly productId: string;

  @Z(qty)
  public readonly qty: number;

  @Z(price)
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
  @Z(qty.optional())
  public readonly qty?: number;

  @Z(price.optional())
  public readonly price?: number;

  constructor(params: UpdateOrderItemDto) {
    super(params);
    this.qty = params.qty;
    this.price = params.price;
  }
}
