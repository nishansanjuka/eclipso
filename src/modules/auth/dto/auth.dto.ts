import { BusinessType } from '../../../types/auth';

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
