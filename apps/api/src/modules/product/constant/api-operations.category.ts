export const CATEGORY_API_OPERATIONS = {
  CREATE_CATEGORY: {
    operationId: 'createCategory',
    description:
      'Creates a new product category within the business. As a business owner, you can organize your products by creating categories with names and descriptions. The category will be associated with your business and can be used to group related products for better organization and customer navigation.',
  },
  UPDATE_CATEGORY: {
    operationId: 'updateCategory',
    description:
      'Updates an existing product category within the business. As a business owner, you can modify category information such as name and description to better reflect your product organization. Only categories belonging to your business can be updated.',
  },
  DELETE_CATEGORY: {
    operationId: 'deleteCategory',
    description:
      'Permanently deletes a product category from the business. As a business owner, you can remove categories that are no longer needed. This operation will remove the category and may affect products that were associated with it. Only categories belonging to your business can be deleted.',
  },
} as const;
