import { BusinessType } from '../../../types/auth';

export class BusinessDto {
  name: string;
  orgId: string;
  businessType: BusinessType;
  createdBy: string;
}
