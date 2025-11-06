import z from 'zod';
import { Z } from '../../../shared/decorators/zod.validation';
import { BaseModel } from '../../../shared/zod/base.model';
import { OrderItemDiscountDto } from '../dto/order-item.discount';

export class OrderItemDiscountEntity extends BaseModel {
  @Z(
    z
      .string({ error: 'Invalid Order Item Id' })
      .min(1, 'Order Item Id is required'),
  )
  public readonly orderItemId: string;

  @Z(
    z
      .string({ error: 'Invalid Discount Id' })
      .min(1, 'Discount Id is required'),
  )
  public readonly discountId: string;

  constructor(params: OrderItemDiscountDto) {
    super(params);
    this.orderItemId = params.orderItemId;
    this.discountId = params.discountId;
  }
}
