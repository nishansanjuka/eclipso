export const ORDER_API_OPERATIONS = {
  CREATE: {
    operationId: 'createOrder',
    description:
      'Creates a draft purchase order for one of your suppliers with an expected delivery date. The status is always draft and the total is calculated from the order items.',
  },
  UPDATE: {
    operationId: 'updateOrder',
    description:
      'Changes the expected date of a draft order, or cancels it (status `cancel`). Only draft orders belonging to your business can be changed; use the receive endpoint to receive one.',
  },
  RECEIVE: {
    operationId: 'receiveOrder',
    description:
      'Marks a draft purchase order as received: every line is added to stock and a purchase inventory movement is recorded, in one transaction. This is the only way purchased stock enters inventory. A received order cannot be changed, received again, or deleted.',
  },
  DELETE: {
    operationId: 'deleteOrder',
    description:
      'Deletes a draft or cancelled order and its items and invoice. Received orders are stock history and cannot be deleted.',
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
