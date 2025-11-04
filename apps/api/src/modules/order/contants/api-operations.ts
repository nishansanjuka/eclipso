export const ORDER_API_OPERATIONS = {
  CREATE: {
    operationId: 'createOrder',
    description:
      'Creates a new order in the system with the provided information including customer details, order items, totals, and payment information. As a business owner, you can create orders for your customers to track sales transactions. The order will be associated with your business and can include multiple order items, discounts, and tax calculations.',
  },
  UPDATE: {
    operationId: 'updateOrder',
    description:
      'Updates an existing order by ID. As a business owner, you can modify order information such as order status, customer details, items, quantities, discounts, and payment information to reflect changes in the transaction. Only orders belonging to your business can be updated.',
  },
  DELETE: {
    operationId: 'deleteOrder',
    description:
      'Permanently deletes an order from the system by ID. As a business owner, you can remove orders that were created in error or are no longer needed. This operation will delete the order record and all associated order items. Only orders belonging to your business can be deleted.',
  },
} as const;
