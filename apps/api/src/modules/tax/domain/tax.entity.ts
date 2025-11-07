import z from 'zod';
import { BaseModel } from '../../../shared/zod/base.model';
import { Z } from '../../../shared/decorators/zod.validation';
import { CreateTaxDto, UpdateTaxDto } from '../dto/tax.dto';
import { TaxType } from '../enums/tax.types.enum';

export class TaxCreateEntity extends BaseModel {
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
      .string({ error: 'Invalid Rate' })
      .regex(
        /^\d+(\.\d{1,2})?$/,
        'Rate must be a valid decimal number with up to 2 decimal places',
      )
      .refine((val) => parseFloat(val) >= 0, 'Rate must be non-negative')
      .refine((val) => parseFloat(val) <= 100, 'Rate must not exceed 100'),
  )
  public readonly rate: string;

  @Z(
    z.enum(TaxType, {
      message: `Tax type must be one of the following: ${Object.values(
        TaxType,
      ).join(', ')}`,
    }),
  )
  public readonly type: TaxType;

  @Z(z.boolean().optional())
  public readonly isActive?: boolean;

  constructor(props: CreateTaxDto) {
    super(props);
    this.id = props.id;
    this.businessId = props.businessId;
    this.name = props.name;
    this.rate = props.rate;
    this.type = props.type;
    this.isActive = props.isActive;
  }
}

export class TaxUpdateEntity extends BaseModel {
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
      .min(1, { message: 'Name cannot be empty' })
      .optional(),
  )
  public readonly name?: string;

  @Z(
    z
      .string({ error: 'Invalid Rate' })
      .regex(
        /^\d+(\.\d{1,2})?$/,
        'Rate must be a valid decimal number with up to 2 decimal places',
      )
      .refine((val) => parseFloat(val) >= 0, 'Rate must be non-negative')
      .refine((val) => parseFloat(val) <= 100, 'Rate must not exceed 100')
      .optional(),
  )
  public readonly rate?: string;

  @Z(
    z
      .enum(TaxType, {
        message: `Tax type must be one of the following: ${Object.values(
          TaxType,
        ).join(', ')}`,
      })
      .optional(),
  )
  public readonly type?: TaxType;

  @Z(z.boolean().optional())
  public readonly isActive?: boolean;

  constructor(props: UpdateTaxDto) {
    super(props);
    this.id = props.id;
    this.businessId = props.businessId;
    this.name = props.name;
    this.rate = props.rate;
    this.type = props.type;
    this.isActive = props.isActive;
  }
}
