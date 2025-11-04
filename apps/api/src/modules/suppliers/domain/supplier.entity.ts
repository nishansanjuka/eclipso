import z from 'zod';
import { BaseModel } from '../../../shared/zod/base.model';
import { Z } from '../../../shared/decorators/zod.validation';
import { CreateSupplierDto } from '../dto/supplier.dto';

export class SuppplierCreateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string;

  @Z(z.string({ error: 'Invalid name' }).min(1, 'Clerk ID is required'))
  public readonly name: string;

  @Z(z.string({ error: 'Invalid Contact' }).min(1, 'Contact is required'))
  public readonly contact: string;

  @Z(
    z
      .string({ error: 'Invalid Description' })
      .min(1, 'Description is required'),
  )
  public readonly description: string;

  @Z(
    z
      .string({ error: 'Invalid Business Id' })
      .min(1, 'Business Id is required'),
  )
  public readonly businessId: string;

  constructor(params: CreateSupplierDto) {
    super(params);
    this.description = params.description;
    this.contact = params.contact;
    this.name = params.name;
    this.businessId = params.businessId;
  }
}

export class SupplierUpdateEntity extends BaseModel {
  @Z(z.string().optional())
  public readonly id?: string;

  @Z(
    z
      .string({ error: 'Invalid name' })
      .min(1, 'Name cannot be empty')
      .optional(),
  )
  public readonly name?: string;

  @Z(
    z
      .string({ error: 'Invalid Contact' })
      .min(1, 'Contact cannot be empty')
      .optional(),
  )
  public readonly contact?: string;

  @Z(
    z
      .string({ error: 'Invalid Description' })
      .min(1, 'Description cannot be empty')
      .optional(),
  )
  public readonly description?: string;

  @Z(
    z
      .string({ error: 'Invalid Business Id' })
      .min(1, 'Business Id cannot be empty')
      .optional(),
  )
  public readonly businessId?: string;

  constructor(params: Partial<CreateSupplierDto>) {
    super(params);
    this.id = params.id;
    this.name = params.name;
    this.contact = params.contact;
    this.description = params.description;
    this.businessId = params.businessId;
  }
}
