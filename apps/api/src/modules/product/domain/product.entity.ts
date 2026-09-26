import z from 'zod';
import { Z } from '../../../shared/decorators/zod.validation';
import { BaseModel } from '../../../shared/zod/base.model';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';

const metadata = z.record(z.string(), z.unknown());

export class ProductCreateEntity extends BaseModel {
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
      .number({ error: 'Invalid Product Price' })
      .int('Price must be a whole number of minor units')
      .min(0, 'Price must not be negative')
      .max(2_000_000_000, 'Price is too large')
      .optional(),
  )
  public readonly price?: number;

  @Z(
    z
      .number({ error: 'Invalid Product Stock Quantity' })
      .int('Stock quantity must be a whole number')
      .min(0, 'Stock quantity must not be negative')
      .max(2_000_000_000, 'Stock quantity is too large')
      .optional(),
  )
  public readonly stockQty?: number;

  @Z(metadata.optional())
  public readonly metadata?: object;

  @Z(z.string().nullable().optional())
  public readonly brandId?: string;

  constructor(params: CreateProductDto) {
    super(params);
    this.businessId = params.businessId;
    this.supplierId = params.supplierId;
    this.name = params.name;
    this.price = params.price;
    this.sku = params.sku;
    this.stockQty = params.stockQty;
    this.metadata = params.metadata;
    this.brandId = params.brandId;
  }
}

export class ProductUpdateEntity extends BaseModel {
  @Z(
    z
      .string({ error: 'Invalid Product Name' })
      .min(1, 'Product Name is required')
      .optional(),
  )
  public readonly name?: string;

  @Z(
    z
      .string({ error: 'Invalid Product Sku' })
      .min(1, 'Product Sku is required')
      .optional(),
  )
  public readonly sku?: string;

  @Z(
    z
      .number({ error: 'Invalid Product Price' })
      .int('Price must be a whole number of minor units')
      .min(0, 'Price must not be negative')
      .max(2_000_000_000, 'Price is too large')
      .optional(),
  )
  public readonly price?: number;

  @Z(metadata.optional())
  public readonly metadata?: object;

  @Z(z.string().nullable().optional())
  public readonly brandId?: string | null;

  // Deliberately no stock field: stock only moves through the inventory ledger.
  constructor(params: UpdateProductDto) {
    super(params);
    this.name = params.name;
    this.price = params.price;
    this.sku = params.sku;
    this.metadata = params.metadata;
    this.brandId = params.brandId;
  }
}
