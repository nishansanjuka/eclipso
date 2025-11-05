export const INVOICE_API_OPERATIONS = {
  CALCULATE: {
    operationId: 'calculateInvoice',
    description:
      'Calculates and updates the invoice totals for a specific order. As a business owner, you can trigger invoice calculations to automatically compute the subtotal, total taxes, total discounts, and grand total based on all order items and their associated taxes and discounts. This ensures accurate billing by aggregating all line items, applying percentage or fixed discounts, and calculating taxes based on defined rates. Only invoices for orders belonging to your business can be calculated.',
  },
} as const;
