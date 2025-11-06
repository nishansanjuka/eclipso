export const PRODUCT_API_OPERATIONS = {
  CREATE_PRODUCT: {
    operationId: 'createProduct',
    description:
      'Creates a new product within the business. As a business owner, you can add products with details such as name, description, price, SKU, and category. The product will be associated with your business and can be used for inventory management, sales, and ordering.',
  },
  UPDATE_PRODUCT: {
    operationId: 'updateProduct',
    description:
      'Updates an existing product within the business. As a business owner, you can modify product information such as name, description, price, SKU, stock levels, and category assignment. Only products belonging to your business can be updated.',
  },
  DELETE_PRODUCT: {
    operationId: 'deleteProduct',
    description:
      'Permanently deletes a product from the business. As a business owner, you can remove products that are no longer offered or needed. This operation will remove the product and may affect inventory records, orders, and invoices that were associated with it. Only products belonging to your business can be deleted.',
  },
} as const;
