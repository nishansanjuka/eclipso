import z from 'zod';
import { Z } from '../../../shared/decorators/zod.validation';
import { BaseModel } from '../../../shared/zod/base.model';
import {
  CreateInventoryMovementDto,
  UpdateInventoryMovementDto,
} from '../dto/inventory.movement';

export class InventoryCreateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string;

  @Z(z.string({ error: 'Invalid Product Id' }).min(1, 'Product Id is required'))
  public readonly productId: string;

  @Z(z.number({ error: 'Invalid Quantity' }).min(1, 'Quantity is required'))
  public readonly qty: number;

  @Z(z.string({ error: 'Invalid Order Id' }).min(1, 'Order Id is required'))
  public readonly orderId?: string;

  constructor(params: CreateInventoryMovementDto) {
    super(params);
    this.orderId = params.orderId;
    this.productId = params.productId;
    this.qty = params.qty;
  }
}

export class InventoryUpdateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string;

  @Z(z.number({ error: 'Invalid Quantity' }).min(1, 'Quantity is required'))
  public readonly qty?: number;

  constructor(params: UpdateInventoryMovementDto) {
    super(params);
    this.qty = params.qty;
  }
}
