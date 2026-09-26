import { BusinessType } from '../../auth/enums/business-type.enum';

export class BusinessDto {
  name: string;
  orgId: string;
  slug?: string;
  businessType: BusinessType;
  registeredName?: string | null;
  registrationNumber?: string | null;
  phone?: string | null;
  country?: string;
  addressLine?: string | null;
  city?: string | null;
  postalCode?: string | null;
  vatRegistered?: boolean;
  vatNumber?: string | null;
  currency?: string;
  rounding?: string;
  onboardingCompletedAt?: Date;
}
