export const INVOICE_API_OPERATIONS = {
  GET: {
    operationId: 'getInvoice',
    description:
      'Retrieves detailed invoice information for a specific order by order ID. As a business owner, you can view complete invoice details including order information, all order items with their associated products, applied taxes, and discounts. This provides a comprehensive view of the transaction for billing and record-keeping purposes. Only invoices for orders belonging to your business can be accessed.',
  },
  CALCULATE: {
    operationId: 'calculateInvoice',
    description:
      'Calculates and updates the invoice totals for a specific order. As a business owner, you can trigger invoice calculations to automatically compute the subtotal, total taxes, total discounts, and grand total based on all order items and their associated taxes and discounts. This ensures accurate billing by aggregating all line items, applying percentage or fixed discounts, and calculating taxes based on defined rates. Only invoices for orders belonging to your business can be calculated.',
  },
} as const;
