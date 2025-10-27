export enum BusinessType {
  RETAIL = 'retail',
  SERVICE = 'service',
  MANUFACTURING = 'manufacturing',
}

interface BusinessTypeMeta {
  label: string;
  description: string;
}

export const BusinessTypeMetaData: Record<BusinessType, BusinessTypeMeta> = {
  [BusinessType.RETAIL]: { label: 'Retail', description: 'Retail business' },
  [BusinessType.SERVICE]: {
    label: 'Service',
    description: 'Service-based business',
  },
  [BusinessType.MANUFACTURING]: {
    label: 'Manufacturing',
    description: 'Manufacturing business',
  },
};
