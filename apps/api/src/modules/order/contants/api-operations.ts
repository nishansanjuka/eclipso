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

export const ORDER_ITEM_API_OPERATIONS = {
  CREATE: {
    operationId: 'createOrderItem',
    description:
      'Creates a new order item for an existing order. As a business owner, you can add products to an order by specifying the product ID, quantity, and price. The product must belong to your business. This allows you to build up an order with multiple items, apply discounts and taxes to individual items.',
  },
  UPDATE: {
    operationId: 'updateOrderItem',
    description:
      'Updates an existing order item by ID. As a business owner, you can modify order item details such as quantity, price, or associated product. This is useful for correcting errors or adjusting order details before finalizing. Only order items associated with products belonging to your business can be updated.',
  },
  DELETE: {
    operationId: 'deleteOrderItem',
    description:
      'Permanently deletes an order item from an order by ID. As a business owner, you can remove items that were added in error or are no longer needed in the order. This operation will remove the order item and any associated discounts or taxes applied to it. Only order items associated with products belonging to your business can be deleted.',
  },
} as const;
