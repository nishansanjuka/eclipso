export const SALE_API_OPERATIONS = {
  CREATE: {
    operationId: 'createSale',
    description:
      "Creates a new sale in the system with sale items and automatically handles inventory movements. The sale will be associated with the authenticated user's organization. This operation validates product availability, creates the sale, sale items, deducts inventory, and creates inventory movement records - all in a single transaction.",
  },
  UPDATE: {
    operationId: 'updateSale',
    description:
      "Updates an existing sale's information by ID. This operation allows modification of sale details within the user's organization.",
  },
  DELETE: {
    operationId: 'deleteSale',
    description:
      "Permanently removes a sale from the system by ID. This operation will delete the sale record, all associated sale items, and inventory movements within the user's organization. This action cannot be undone.",
  },
  GET: {
    operationId: 'getSale',
    description:
      "Retrieves a sale by ID with all associated sale items. The sale must belong to the authenticated user's organization.",
  },
} as const;
