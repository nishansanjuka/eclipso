export const BRAND_API_OPERATIONS = {
  CREATE: {
    operationId: 'createBrand',
    description:
      'Creates a new brand within the business. As a business owner, you can add brands with details such as name and description. The brand will be associated with your business and can be used to categorize products by their manufacturer or brand identity.',
  },
  UPDATE: {
    operationId: 'updateBrand',
    description:
      'Updates an existing brand within the business. As a business owner, you can modify brand information such as name and description. Only brands belonging to your business can be updated.',
  },
  DELETE: {
    operationId: 'deleteBrand',
    description:
      'Permanently deletes a brand from the business. As a business owner, you can remove brands that are no longer needed. This operation will remove the brand and may affect products that were associated with it. Only brands belonging to your business can be deleted.',
  },
} as const;
