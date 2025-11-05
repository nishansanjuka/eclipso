import z from 'zod';
import { BaseModel } from '../../../shared/zod/base.model.js';
import { Z } from '../../../shared/decorators/zod.validation.js';
import { CreateTaxDto, UpdateTaxDto } from '../dto/tax.dto.js';
import { TaxType } from '../enums/tax.types.enum.js';

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
      .number({ error: 'Rate is required' })
      .min(0, { message: 'Rate must be non-negative' }),
  )
  public readonly rate: number;

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
      .min(1, { message: 'Name cannot be empty' }),
  )
  public readonly name?: string;

  @Z(
    z
      .number({ error: 'Rate is required' })
      .min(0, { message: 'Rate must be non-negative' }),
  )
  public readonly rate?: number;

  @Z(
    z.enum(TaxType, {
      message: `Tax type must be one of the following: ${Object.values(
        TaxType,
      ).join(', ')}`,
    }),
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
