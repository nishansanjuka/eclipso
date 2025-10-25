import z from 'zod';
import { BaseModel } from '../../../shared/zod/base.model';
import { Z } from '../../../shared/decorators/zod.validation';
import {
  CreateOrganizationDto,
  DeleteOrganizationDto,
  UpdateOrganizationDto,
} from '../dto/auth.dto';
import { BusinessTypeObject, type BusinessType } from '../../../types/auth';

export class CreateOrganizationEntity extends BaseModel {
  @Z(
    z
      .string({ error: 'Business Name is required' })
      .min(3, 'Business Name must atleast 3 character long'),
  )
  public readonly name: string;

  @Z(
    z.enum(Object.values(BusinessTypeObject) as [string, ...string[]], {
      message: `Business type must be one of the following: ${Object.values(
        BusinessTypeObject,
      ).join(', ')}`,
    }),
  )
  public readonly businessType: BusinessType;

  constructor(params: CreateOrganizationDto) {
    super(params);
    this.name = params.name;
    this.businessType = params.businessType;
  }
}

export class UpdateOrganizationEntity extends BaseModel {
  @Z(
    z
      .string({ error: 'Business Name is required' })
      .min(3, 'Business Name must atleast 3 character long')
      .optional(),
  )
  public readonly name?: string | null;

  @Z(
    z
      .enum(Object.values(BusinessTypeObject) as [string, ...string[]], {
        message: `Business type must be one of the following: ${Object.values(
          BusinessTypeObject,
        ).join(', ')}`,
      })
      .optional(),
  )
  public readonly businessType?: BusinessType | null;

  @Z(
    z.string({ error: 'Organization ID is required' }).startsWith('org_', {
      error: 'Invalid Organization ID format',
    }),
  )
  public readonly orgId?: string | null;

  constructor(params: UpdateOrganizationDto) {
    super(params);
    this.name = params.name;
    this.businessType = params.businessType;
    this.orgId = params.orgId;
  }
}

export class DeleteOrganizationEntity extends BaseModel {
  @Z(
    z.string({ error: 'Organization ID is required' }).startsWith('org_', {
      error: 'Invalid Organization ID format',
    }),
  )
  public readonly orgId: string;

  constructor(params: DeleteOrganizationDto) {
    super(params);
    this.orgId = params.orgId;
  }
}
