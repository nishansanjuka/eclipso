import z from 'zod';
import { BaseModel } from '../../../shared/zod/base.model';
import { Z } from '../../../shared/decorators/zod.validation';
import { CreateCustomerDto } from '../dto/customer.dto';

export class CustomerCreateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string;

  @Z(z.string({ error: 'Invalid name' }).min(1, 'Name is required'))
  public readonly name: string;

  @Z(z.string({ error: 'Invalid phone' }).min(1, 'Phone is required'))
  public readonly phone: string;

  @Z(z.email('Invalid email format').min(1, 'Email is required'))
  public readonly email: string;

  @Z(
    z
      .string({ error: 'Invalid Business Id' })
      .min(1, 'Business Id is required'),
  )
  public readonly businessId: string;

  constructor(params: CreateCustomerDto) {
    super(params);
    this.name = params.name;
    this.phone = params.phone;
    this.email = params.email;
    this.businessId = params.businessId;
  }
}

export class CustomerUpdateEntity extends BaseModel {
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
      .string({ error: 'Invalid phone' })
      .min(1, 'Phone cannot be empty')
      .optional(),
  )
  public readonly phone?: string;

  @Z(z.email('Invalid email format').optional())
  public readonly email?: string;

  @Z(
    z
      .string({ error: 'Invalid Business Id' })
      .min(1, 'Business Id cannot be empty')
      .optional(),
  )
  public readonly businessId?: string;

  constructor(params: Partial<CreateCustomerDto>) {
    super(params);
    this.id = params.id;
    this.name = params.name;
    this.phone = params.phone;
    this.email = params.email;
    this.businessId = params.businessId;
  }
}
