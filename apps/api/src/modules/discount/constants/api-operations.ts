export const DISCOUNT_API_OPERATIONS = {
  CREATE: {
    operationId: 'createDiscount',
    description:
      'Creates a new discount record in the system with the provided information including discount name, value, and type. As a business owner, you can define various discount rates applicable to your products and services. The discount record will be associated with your business and can be applied to transactions.',
  },
  UPDATE: {
    operationId: 'updateDiscount',
    description:
      'Updates an existing discount record by ID. As a business owner, you can modify discount information such as name, value, and type to reflect current promotional strategies or business requirements. Only discount records belonging to your business can be updated.',
  },
  DELETE: {
    operationId: 'deleteDiscount',
    description:
      'Permanently deletes a discount record from the system by ID. As a business owner, you can remove discount records that are no longer applicable. This operation will delete the discount record and may affect products or transactions that were associated with it. Only discount records belonging to your business can be deleted.',
  },
} as const;
