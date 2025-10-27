import { BusinessType } from '../../auth/enums/business-type.enum';

export class BusinessDto {
  name: string;
  orgId: string;
  businessType: BusinessType;
  createdBy: string;
}
