import z from 'zod';
import { Z } from '../../../shared/decorators/zod.validation';
import { BaseModel } from '../../../shared/zod/base.model';
import { CreateDiscountDto, UpdateDiscountDto } from '../dto/discount.dto';

export class DiscountCreateEntity extends BaseModel {
  @Z(z.string().optional())
  public readonly id?: string;

  @Z(
    z
      .string({ error: 'Business ID is required' })
      .min(1, { message: 'Business ID cannot be empty' }),
  )
  public readonly businessId: string;

  @Z(
    z
      .string({ error: 'Name is required' })
      .min(1, { message: 'Name cannot be empty' }),
  )
  public readonly name: string;

  @Z(
    z
      .number({ error: 'Value is required' })
      .min(0, { message: 'Value must be non-negative' }),
  )
  public readonly value: number;

  @Z(
    z
      .string({ error: 'Type is required' })
      .min(1, { message: 'Type cannot be empty' }),
  )
  public readonly type: string;

  @Z(z.date({ error: 'Start date is required' }))
  public readonly start: Date;

  @Z(z.date({ error: 'End date is required' }))
  public readonly end: Date;

  @Z(z.boolean().optional())
  public readonly isActive?: boolean;

  constructor(props: CreateDiscountDto) {
    super(props);
    this.id = props.id;
    this.businessId = props.businessId;
    this.name = props.name;
    this.value = props.value;
    this.type = props.type;
    this.start = props.start;
    this.end = props.end;
    this.isActive = props.isActive;
  }
}

export class DiscountUpdateEntity extends BaseModel {
  @Z(z.string().optional())
  public readonly id?: string;

  @Z(
    z
      .string({ error: 'Business ID is required' })
      .min(1, { message: 'Business ID cannot be empty' }),
  )
  public readonly businessId: string;

  @Z(z.string({ error: 'Name is required' }).optional())
  public readonly name?: string;

  @Z(
    z
      .number({ error: 'Value is required' })
      .min(0, { message: 'Value must be non-negative' }),
  )
  public readonly value?: number;

  @Z(z.string({ error: 'Type is required' }).optional())
  public readonly type?: string;

  @Z(z.date({ error: 'Start date is required' }).optional())
  public readonly start?: Date;

  @Z(z.date({ error: 'End date is required' }).optional())
  public readonly end?: Date;

  @Z(z.boolean().optional())
  public readonly isActive?: boolean;

  constructor(props: UpdateDiscountDto) {
    super(props);
    this.id = props.id;
    this.businessId = props.businessId;
    this.name = props.name;
    this.value = props.value;
    this.type = props.type;
    this.start = props.start;
    this.end = props.end;
    this.isActive = props.isActive;
  }
}
