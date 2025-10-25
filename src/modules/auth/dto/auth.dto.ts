import { BusinessType, UserRole } from '../../../types/auth';

export class CreateOrganizationDto {
  name: string;
  businessType: BusinessType;
}

export class UpdateOrganizationDto {
  name?: string | null;
  businessType?: BusinessType | null;
  orgId?: string | null;
}

export class DeleteOrganizationDto {
  orgId: string;
}

export class InviteUserDto {
  emails: string[];
  role?: UserRole;
  inviterUserId: string;
  orgId: string;
}
