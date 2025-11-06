import z from 'zod';
import { Z } from '../../../shared/decorators/zod.validation';
import { BaseModel } from '../../../shared/zod/base.model';
import { OrderItemTaxDto } from '../dto/order-item.tax';

export class OrderItemTaxEntity extends BaseModel {
  @Z(
    z
      .string({ error: 'Invalid Order Item Id' })
      .min(1, 'Order Item Id is required'),
  )
  public readonly orderItemId: string;

  @Z(z.string({ error: 'Invalid Tax Id' }).min(1, 'Tax Id is required'))
  public readonly taxId: string;

  constructor(params: OrderItemTaxDto) {
    super(params);
    this.orderItemId = params.orderItemId;
    this.taxId = params.taxId;
  }
}
