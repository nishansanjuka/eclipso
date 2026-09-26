export const SALE_API_OPERATIONS = {
  CREATE: {
    operationId: 'createSale',
    description:
      "Creates a new sale in the system with sale items and automatically handles inventory movements. The sale will be associated with the authenticated user's organization. This operation validates product availability, creates the sale, sale items, deducts inventory, and creates inventory movement records - all in a single transaction.",
  },
  UPDATE: {
    operationId: 'updateSale',
    description:
      'Changes the customer attached to a completed sale. Totals, lines and payments cannot be edited; use a return or a void to correct a sale.',
  },
  VOID: {
    operationId: 'voidSale',
    description:
      'Voids a completed sale with a reason. Sales are never deleted: the sale is marked voided, all sold units are returned to stock with inventory movements, and completed payments are marked refunded. A sale that already has returns cannot be voided, and a voided sale cannot be voided again.',
  },
  GET: {
    operationId: 'getSale',
    description:
      "Retrieves a sale by ID with all associated sale items. The sale must belong to the authenticated user's organization.",
  },
} as const;
