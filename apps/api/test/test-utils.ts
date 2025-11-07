import { INestApplication } from '@nestjs/common';

/**
 * Mock Drizzle Client for testing
 */
export const mockDrizzleClient = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  execute: jest.fn(),
  transaction: jest.fn(),
};

/**
 * Mock authenticated user object
 */
export const mockAuthUser = {
  userId: 'user_test123',
  orgId: 'org_test123',
  role: 'org:admin',
};

/**
 * Mock business object
 */
export const mockBusiness = {
  id: 'business-uuid-123',
  name: 'Test Business',
  orgId: 'org_test123',
  businessType: 'retail',
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Mock customer object
 */
export const mockCustomer = {
  id: 'customer-uuid-123',
  businessId: 'business-uuid-123',
  name: 'John Doe',
  phone: '+1234567890',
  email: 'john@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Mock product object
 */
export const mockProduct = {
  id: 'product-uuid-123',
  businessId: 'business-uuid-123',
  name: 'Test Product',
  sku: 'TEST-001',
  price: '29.99',
  stockQty: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Mock sale object
 */
export const mockSale = {
  id: 'sale-uuid-123',
  businessId: 'business-uuid-123',
  customerId: 'customer-uuid-123',
  userId: 'user_test123',
  totalAmount: '59.98',
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Mock sale item object
 */
export const mockSaleItem = {
  id: 'sale-item-uuid-123',
  saleId: 'sale-uuid-123',
  productId: 'product-uuid-123',
  qty: 2,
  price: '29.99',
  discountId: null,
  taxId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Mock payment object
 */
export const mockPayment = {
  id: 'payment-uuid-123',
  saleId: 'sale-uuid-123',
  userId: 'user_test123',
  method: 'CASH',
  amount: '59.98',
  status: 'COMPLETED',
  transactionRef: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Mock return object
 */
export const mockReturn = {
  id: 'return-uuid-123',
  saleId: 'sale-uuid-123',
  userId: 'user_test123',
  qty: 1,
  reason: 'DEFECTIVE',
  status: 'PENDING',
  notes: 'Product stopped working',
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Mock refund object
 */
export const mockRefund = {
  id: 'refund-uuid-123',
  returnId: 'return-uuid-123',
  userId: 'user_test123',
  method: 'CASH',
  amount: '29.99',
  reason: 'Defective product',
  transactionRef: 'REFUND-001',
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Create mock repository with common methods
 */
export function createMockRepository() {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

/**
 * Create mock service with common methods
 */
export function createMockService() {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

/**
 * Helper to create mock use case
 */
export function createMockUseCase() {
  return {
    execute: jest.fn(),
  };
}

/**
 * Clean up test app
 */
export async function cleanupTestApp(app: INestApplication) {
  if (app) {
    await app.close();
  }
}
