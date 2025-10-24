import { BusinessType } from '../../../types/auth';

export class BusinessCreateDto {
  name: string;
  orgId: string;
  businessType: BusinessType;
  createdBy: string;
}
