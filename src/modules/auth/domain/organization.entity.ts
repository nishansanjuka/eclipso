import z from 'zod';
import { BaseModel } from '../../../shared/zod/base.model';
import { Z } from '../../../shared/decorators/zod.validation';
import {
  CreateOrganizationDto,
  DeleteOrganizationDto,
  InviteUserDto,
  UpdateOrganizationDto,
} from '../dto/auth.dto';
import {
  BusinessTypeObject,
  type UserRole,
  type BusinessType,
  UserRoleObject,
} from '../../../types/auth';
import { validatedEmail } from '../../../shared/validators/email.validator';

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

export class InviteUserEntity extends BaseModel {
  @Z(
    z
      .array(validatedEmail, { error: 'Emails are required' })
      .min(1, 'Atleast one email is required'),
  )
  public readonly emails: string[];

  @Z(
    z
      .enum(Object.values(UserRoleObject) as [string, ...string[]], {
        message: `User role must be one of the following: ${Object.values(
          UserRoleObject,
        ).join(', ')}`,
      })
      .optional(),
  )
  public readonly role?: UserRole | null;

  @Z(
    z.string({ error: 'Inviter User ID is required' }).startsWith('user_', {
      error: 'Invalid Inviter User ID format',
    }),
  )
  public readonly inviterUserId?: string;

  @Z(
    z.string({ error: 'Organization ID is required' }).startsWith('org_', {
      error: 'Invalid Organization ID format',
    }),
  )
  public readonly orgId?: string;

  constructor(params: InviteUserDto) {
    super(params);
    this.emails = params.emails;
    this.role = params.role;
    this.inviterUserId = params.inviterUserId;
    this.orgId = params.orgId;
  }
}
