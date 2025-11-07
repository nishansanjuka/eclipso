export const CUSTOMER_API_OPERATIONS = {
  CREATE: {
    operationId: 'createCustomer',
    description:
      "Creates a new customer in the system with the provided information including name, phone, and email. The customer will be associated with the authenticated user's organization.",
  },
  UPDATE: {
    operationId: 'updateCustomer',
    description:
      "Updates an existing customer's information by ID. This operation allows modification of customer details such as name, phone, and email within the user's organization.",
  },
  DELETE: {
    operationId: 'deleteCustomer',
    description:
      "Permanently removes a customer from the system by ID. This operation will delete the customer record and all associated data within the user's organization. This action cannot be undone.",
  },
} as const;
