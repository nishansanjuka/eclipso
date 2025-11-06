export const SUPPLIER_API_OPERATIONS = {
  CREATE: {
    operationId: 'createSupplier',
    description:
      "Creates a new supplier in the system with the provided information including name, contact details, and business information. The supplier will be associated with the authenticated user's organization.",
  },
  UPDATE: {
    operationId: 'updateSupplier',
    description:
      "Updates an existing supplier's information by ID. This operation allows modification of supplier details such as name, contact information, address, and other business-related data within the user's organization.",
  },
  DELETE: {
    operationId: 'deleteSupplier',
    description:
      "Permanently removes a supplier from the system by ID. This operation will delete the supplier record and all associated data within the user's organization. This action cannot be undone.",
  },
} as const;
