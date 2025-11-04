import z from 'zod';
import { Z } from '../../../shared/decorators/zod.validation';
import { BaseModel } from '../../../shared/zod/base.model';
import { CategoryCreateDto, CategoryUpdateDto } from '../dto/category.dto';

export class CategoryCreateEntity extends BaseModel {
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
      .string({ error: 'Invalid Category Name' })
      .min(1, 'Category Name is required'),
  )
  public readonly name: string;

  @Z(z.string({ error: 'Invalid Parent Id' }).optional())
  public readonly parentId?: string;

  constructor(params: CategoryCreateDto) {
    super(params);
    this.id = params.id;
    this.businessId = params.businessId;
    this.name = params.name;
    this.parentId = params.parentId;
  }
}

export class CategoryUpdateEntity extends BaseModel {
  @Z(z.string().nullable().optional())
  public readonly id: string;

  @Z(
    z
      .string({ error: 'Invalid Business Id' })
      .min(1, 'Business Id is required'),
  )
  public readonly businessId: string;

  @Z(z.string({ error: 'Invalid Category Name' }).optional())
  public readonly name?: string;

  @Z(z.string({ error: 'Invalid Parent Id' }).optional())
  public readonly parentId?: string;

  constructor(params: CategoryUpdateDto) {
    super(params);
    this.id = params.id;
    this.businessId = params.businessId;
    this.name = params.name;
    this.parentId = params.parentId;
  }
}
