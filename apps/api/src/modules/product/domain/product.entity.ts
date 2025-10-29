import z from 'zod';
import { Z } from '../../../shared/decorators/zod.validation';
import { BaseModel } from '../../../shared/zod/base.model';

export class OrderCreateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string;

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

  @Z(
    z
      .string({ error: 'Invalid Product Name' })
      .min(1, 'Product Name is required'),
  )
  public readonly name: string;

  @Z(
    z
      .string({ error: 'Invalid Product Sku' })
      .min(1, 'Product Sku is required'),
  )
  public readonly sku: string;

  @Z(
    z
      .number({ error: 'Invalid Product Sku' })
      .min(1, 'Product Sku is required'),
  )
  public readonly price: number;

  @Z(
    z
      .number({ error: 'Invalid Product Stock Quantity' })
      .min(1, 'Product Stock Quantity is required'),
  )
  public readonly stockQty: number;

  constructor(params: OrderCreateEntity) {
    super(params);
    this.businessId = params.businessId;
    this.supplierId = params.supplierId;
    this.name = params.name;
    this.price = params.price;
    this.sku = params.sku;
    this.stockQty = params.stockQty;
  }
}
