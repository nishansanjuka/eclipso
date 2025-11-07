export const ADJUSTMENT_API_OPERATIONS = {
  CREATE: {
    operationId: 'createAdjustment',
    description:
      'Creates a new inventory adjustment record for a specific product. As a business owner, you can adjust product stock quantities by providing a positive value to add stock or a negative value to reduce stock. The adjustment creates an inventory movement record and updates the product stock quantity atomically. Each adjustment must include a reason explaining why the stock is being adjusted (e.g., "Physical count discrepancy", "Damaged goods", "Found extra inventory"). The adjustment is automatically linked to your user account and business for audit trail purposes.',
  },
  GET_BY_ID: {
    operationId: 'getAdjustmentById',
    description:
      'Retrieves a specific adjustment record by its unique identifier. As a business owner or user, you can view detailed information about a particular inventory adjustment including the product, quantity changed, reason, user who made the adjustment, and timestamp.',
  },
  GET_BY_BUSINESS: {
    operationId: 'getAdjustmentsByBusinessId',
    description:
      'Retrieves all inventory adjustment records for a specific business. As a business owner, you can view the complete history of all inventory adjustments made across all products in your business. Results are ordered by creation date with the most recent adjustments appearing first.',
  },
  GET_BY_USER: {
    operationId: 'getAdjustmentsByUserId',
    description:
      'Retrieves all inventory adjustment records created by a specific user. As a business owner, you can track which team member made which adjustments to maintain accountability and audit compliance. Results are ordered by creation date with the most recent adjustments appearing first.',
  },
  GET_ALL: {
    operationId: 'getAllAdjustments',
    description:
      'Retrieves all inventory adjustments for your business with an optional limit for pagination. As a business owner, you can view the complete adjustment history across all products and users. Use the limit parameter to control the number of results returned for better performance when dealing with large datasets.',
  },
  UPDATE: {
    operationId: 'updateAdjustment',
    description:
      'Updates an existing adjustment record by ID. As a business owner, you can modify the reason for an adjustment to provide more accurate documentation or correct mistakes. Note that updating an adjustment does not change the inventory quantity - it only updates the metadata like the reason field.',
  },
  DELETE: {
    operationId: 'deleteAdjustment',
    description:
      'Permanently deletes an adjustment record from the system by ID. As a business owner, you can remove adjustment records that were created in error. This operation will delete the adjustment record and its associated inventory movement. Only adjustments belonging to your business can be deleted. Warning: This does not reverse the stock quantity change - you would need to create a counter-adjustment to reverse the quantity.',
  },
} as const;
