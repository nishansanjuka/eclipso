import {
  BusinessTypeObject,
  UserRoleObject,
  type BusinessType,
  type UserRole,
} from '../../../types/auth';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty()
  name: string;
  @ApiProperty({ enum: Object.values(BusinessTypeObject) })
  businessType: BusinessType;
}

export class UpdateOrganizationDto {
  @ApiProperty()
  name?: string | null;
  @ApiProperty({
    enum: Object.values(BusinessTypeObject),
  })
  businessType?: BusinessType | null;
  @ApiProperty()
  orgId?: string | null;
}

export class DeleteOrganizationDto {
  orgId: string;
}

export class InviteUserDto {
  @ApiProperty()
  emails: string[];
  @ApiProperty({ enum: Object.values(UserRoleObject) })
  role?: UserRole;
  @ApiProperty()
  inviterUserId: string;
  @ApiProperty()
  orgId: string;
}
