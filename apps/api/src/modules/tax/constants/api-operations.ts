export const TAX_API_OPERATIONS = {
  CREATE: {
    operationId: 'createTax',
    description:
      'Creates a new tax record in the system with the provided information including tax name, rate, and type. As a business owner, you can define various tax rates applicable to your products and services. The tax record will be associated with your business and can be applied to transactions.',
  },
  UPDATE: {
    operationId: 'updateTax',
    description:
      'Updates an existing tax record by ID. As a business owner, you can modify tax information such as name, rate, and type to reflect current tax regulations or business requirements. Only tax records belonging to your business can be updated.',
  },
  DELETE: {
    operationId: 'deleteTax',
    description:
      'Permanently deletes a tax record from the system by ID. As a business owner, you can remove tax records that are no longer applicable. This operation will delete the tax record and may affect products or transactions that were associated with it. Only tax records belonging to your business can be deleted.',
  },
} as const;
