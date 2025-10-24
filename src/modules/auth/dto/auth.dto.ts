import { BusinessType } from '../../../types/auth';

export class CreateOrganizationDto {
  name: string;
  businessType: BusinessType;
}
