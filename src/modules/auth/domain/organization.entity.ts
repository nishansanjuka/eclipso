import z from 'zod';
import { BaseModel } from '../../../shared/zod/base.model';
import { Z } from '../../../shared/decorators/zod.validation';
import { CreateOrganizationDto } from '../dto/auth.dto';
import { BusinessTypeObject, type BusinessType } from '../../../types/auth';

export class CreateOrganizationEntity extends BaseModel {
  @Z(
    z
      .string({ error: 'Business ID is required' })
      .min(3, 'Must atleast 3 character long'),
  )
  public readonly name: string;

  @Z(
    z.enum(Object.values(BusinessTypeObject) as [string, ...string[]], {
      message: 'Business type must be retail, service, or manufacturing',
    }),
  )
  public readonly businessType: BusinessType;

  constructor(params: CreateOrganizationDto) {
    super(params);
    this.name = params.name;
    this.businessType = params.businessType;
  }
}
