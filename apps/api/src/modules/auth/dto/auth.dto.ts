import { ApiProperty } from '@nestjs/swagger';
import { BusinessType } from '../enums/business-type.enum';
import { UserRole } from '../enums/auth-role.enum';

export class CreateOrganizationDto {
  @ApiProperty()
  name: string;
  @ApiProperty({ enum: BusinessType })
  businessType: BusinessType;
}

export class UpdateOrganizationDto {
  @ApiProperty()
  name?: string | null;
  @ApiProperty({
    enum: Object.values(BusinessType),
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
  @ApiProperty({ enum: UserRole })
  role?: UserRole;
  @ApiProperty()
  inviterUserId: string;
  @ApiProperty()
  orgId: string;
}
