import z from 'zod';
import { Z } from '../../../shared/decorators/zod.validation';
import { BaseModel } from '../../../shared/zod/base.model';
import { CreateBrandDto, UpdateBrandDto } from '../dto/brand';

export class BrandCreateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string;

  @Z(
    z
      .string({ error: 'Business ID is required' })
      .min(1, 'Business ID cannot be empty'),
  )
  public readonly businessId: string;

  @Z(
    z
      .string({ error: 'Invalid Name' })
      .min(2, 'Name must be at least 2 characters long')
      .max(100, 'Name must be at most 100 characters long'),
  )
  public readonly name: string;

  @Z(
    z
      .string({ error: 'Invalid Slug' })
      .min(2, 'Slug must be at least 2 characters long')
      .max(100, 'Slug must be at most 100 characters long'),
  )
  public readonly slug: string;

  @Z(
    z
      .string({ error: 'Invalid Description' })
      .min(2, 'Description must be at least 2 characters long')
      .max(100, 'Description must be at most 100 characters long'),
  )
  public readonly description: string;

  @Z(z.string().url('Logo URL must be a valid URL').optional().nullable())
  public readonly logoUrl?: string;

  constructor(params: CreateBrandDto) {
    super(params);
    this.businessId = params.businessId;
    this.name = params.name;
    this.slug = params.slug;
    this.description = params.description;
    this.logoUrl = params.logoUrl;
  }
}

export class BrandUpdateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id?: string;

  @Z(z.string({ error: 'Invalid Name' }).optional())
  public readonly name?: string;

  @Z(z.string({ error: 'Invalid Slug' }).optional())
  public readonly slug?: string;

  @Z(z.string({ error: 'Invalid Description' }).optional())
  public readonly description?: string;

  @Z(z.string().url('Logo URL must be a valid URL').optional().nullable())
  public readonly logoUrl?: string;

  constructor(params: UpdateBrandDto) {
    super(params);
    this.name = params.name;
    this.slug = params.slug;
    this.description = params.description;
    this.logoUrl = params.logoUrl;
  }
}
