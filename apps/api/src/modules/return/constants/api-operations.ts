export const RETURN_API_OPERATIONS = {
  CREATE: {
    operationId: 'createReturn',
    description:
      'Creates a new return for a sale with return items and optionally a refund. The return will be associated with the authenticated user and their organization. This operation validates the sale exists, validates return quantities, creates the return, return items, adds inventory back to stock, and creates inventory movement records - all in a single transaction.',
  },
  UPDATE: {
    operationId: 'updateReturn',
    description:
      "Updates an existing return's information by ID. This operation allows modification of return details within the user's organization.",
  },
  DELETE: {
    operationId: 'deleteReturn',
    description:
      "Permanently removes a return from the system by ID. This operation will delete the return record and all associated return items within the user's organization. This action cannot be undone.",
  },
  GET: {
    operationId: 'getReturn',
    description:
      "Retrieves a return by ID with all associated return items and refund information. The return must belong to the authenticated user's organization.",
  },
} as const;
