import z from 'zod';
import { BaseModel } from '../../../shared/zod/base.model';
import { Z } from '../../../shared/decorators/zod.validation';
import { SupplierCreateDto } from '../dto/supplier.dto';

export class SuppplierCreateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string | null;

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

  constructor(params: SupplierCreateDto) {
    super(params);
    this.description = params.description;
    this.contact = params.contact;
    this.name = params.name;
  }
}
