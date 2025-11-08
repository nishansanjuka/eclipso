# Testing Guide

This document provides comprehensive information about testing the Eclipso API application.

## Table of Contents

- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Unit Tests](#unit-tests)
- [E2E Tests](#e2e-tests)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [Mocking](#mocking)
- [Best Practices](#best-practices)

## Test Structure

```
apps/api/
├── src/
│   └── modules/
│       └── [module]/
│           ├── application/
│           │   └── *.usecase.spec.ts    # Unit tests for use cases
│           ├── infrastructure/
│           │   ├── *.repository.spec.ts # Unit tests for repositories
│           │   └── *.service.spec.ts    # Unit tests for services
│           └── presentation/
│               └── *.controller.spec.ts # Unit tests for controllers
└── test/
    ├── app.e2e-spec.ts                 # Main E2E tests
    ├── e2e/
    │   ├── customer.e2e-spec.ts        # Customer E2E tests
    │   ├── sale.e2e-spec.ts            # Sale E2E tests
    │   └── return.e2e-spec.ts          # Return E2E tests
    ├── test-utils.ts                    # Test utilities and mocks
    └── jest-e2e.json                    # E2E Jest configuration
```

## Running Tests

### All Unit Tests

```bash
pnpm test
```

### Unit Tests in Watch Mode

```bash
pnpm test:watch
```

### Unit Tests with Coverage

```bash
pnpm test:cov
```

### E2E Tests

```bash
pnpm test:e2e
```

### Specific Test File

```bash
# Unit test
pnpm test customer-create.usecase.spec

# E2E test
pnpm test:e2e customer.e2e-spec
```

### Debug Mode

```bash
pnpm test:debug
```

## Unit Tests

Unit tests are located alongside the source files they test, using the `.spec.ts` extension.

### Use Case Tests

Example: `customer-create.usecase.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CustomerCreateUseCase } from './customer-create.usecase';
import { CustomerService } from '../infrastructure/customer.service';
import { BusinessService } from '../../business/infrastructure/business.service';

describe('CustomerCreateUseCase', () => {
  let useCase: CustomerCreateUseCase;
  let customerService: jest.Mocked<CustomerService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerCreateUseCase,
        {
          provide: CustomerService,
          useValue: {
            createCustomer: jest.fn(),
          },
        },
        {
          provide: BusinessService,
          useValue: {
            getBusinessWithUserByOrgId: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<CustomerCreateUseCase>(CustomerCreateUseCase);
    customerService = module.get(CustomerService);
    businessService = module.get(BusinessService);
  });

  it('should create a customer successfully', async () => {
    // Arrange
    const mockBusiness = { id: 'business-id', orgId: 'org-id' };
    const mockCustomer = { id: 'customer-id', name: 'John Doe' };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(mockBusiness);
    customerService.createCustomer.mockResolvedValue([mockCustomer]);

    // Act
    const result = await useCase.execute('org-id', {
      name: 'John Doe',
      phone: '+1234567890',
    });

    // Assert
    expect(result).toEqual(mockCustomer);
    expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(
      'org-id',
    );
  });
});
```

### Controller Tests

Example: `customer.controller.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CustomerController } from './customer.controller';
import { CustomerCreateUseCase } from '../application/customer-create.usecase';

describe('CustomerController', () => {
  let controller: CustomerController;
  let createUseCase: jest.Mocked<CustomerCreateUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        {
          provide: CustomerCreateUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CustomerController>(CustomerController);
    createUseCase = module.get(CustomerCreateUseCase);
  });

  it('should create a customer', async () => {
    const mockUser = { userId: 'user-id', orgId: 'org-id' };
    const createDto = { name: 'John Doe', phone: '+1234567890' };
    const mockCustomer = { id: 'customer-id', ...createDto };

    createUseCase.execute.mockResolvedValue(mockCustomer);

    const result = await controller.createCustomer(createDto, mockUser);

    expect(result).toEqual(mockCustomer);
    expect(createUseCase.execute).toHaveBeenCalledWith(
      mockUser.orgId,
      createDto,
    );
  });
});
```

## E2E Tests

E2E tests test the entire request/response cycle through the API endpoints.

### Basic E2E Test Structure

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Module (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /endpoint', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/endpoint')
        .send({ data: 'test' })
        .expect(401);
    });
  });
});
```

### With Authentication (Clerk Integration)

For tests requiring authentication, you'll need to:

1. Create a test user in Clerk
2. Generate a session token
3. Use the token in requests

```typescript
describe('Authenticated Endpoints', () => {
  let authToken: string;

  beforeAll(async () => {
    // In real scenario, integrate with Clerk to get token
    // This is a placeholder
    authToken = await getTestAuthToken();
  });

  it('should create a resource when authenticated', () => {
    return request(app.getHttpServer())
      .post('/endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('Test');
      });
  });
});
```

## Test Coverage

### Generate Coverage Report

```bash
pnpm test:cov
```

This generates a coverage report in the `coverage/` directory.

### View Coverage Report

```bash
# Open coverage/lcov-report/index.html in your browser
open coverage/lcov-report/index.html
```

### Coverage Thresholds

Jest is configured to track coverage for:

- **Statements**: Minimum 80%
- **Branches**: Minimum 70%
- **Functions**: Minimum 80%
- **Lines**: Minimum 80%

## Writing Tests

### Test Naming Conventions

- Use descriptive test names
- Follow the pattern: `should [expected behavior] when [condition]`
- Group related tests using `describe` blocks

```typescript
describe('CustomerCreateUseCase', () => {
  describe('execute', () => {
    it('should create a customer when valid data is provided', () => {
      // Test implementation
    });

    it('should throw error when business is not found', () => {
      // Test implementation
    });

    it('should throw error when customer data is invalid', () => {
      // Test implementation
    });
  });
});
```

### Arrange-Act-Assert Pattern

```typescript
it('should create a customer', async () => {
  // Arrange: Set up test data and mocks
  const orgId = 'org-123';
  const customerData = { name: 'John Doe' };
  mockBusinessService.getBusinessWithUserByOrgId.mockResolvedValue(
    mockBusiness,
  );

  // Act: Execute the code being tested
  const result = await useCase.execute(orgId, customerData);

  // Assert: Verify the results
  expect(result).toBeDefined();
  expect(result.name).toBe('John Doe');
});
```

## Mocking

### Mock Services

```typescript
const mockCustomerService = {
  createCustomer: jest.fn(),
  getCustomerById: jest.fn(),
  updateCustomer: jest.fn(),
  deleteCustomer: jest.fn(),
};
```

### Mock Database Client

```typescript
import { mockDrizzleClient } from '../../../test/test-utils';

// Use in tests
mockDrizzleClient.select.mockReturnThis();
mockDrizzleClient.from.mockReturnThis();
mockDrizzleClient.where.mockReturnThis();
mockDrizzleClient.execute.mockResolvedValue([mockData]);
```

### Mock Transactions

```typescript
const mockDb = {
  transaction: jest.fn((callback) => callback(mockDb)),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([mockData]),
};
```

## Best Practices

### 1. Isolate Tests

Each test should be independent and not rely on other tests.

```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

### 2. Test Edge Cases

Test not just the happy path, but also:

- Error conditions
- Invalid inputs
- Edge cases
- Boundary conditions

```typescript
it('should throw error when quantity is negative', async () => {
  await expect(useCase.execute(orgId, { qty: -1 })).rejects.toThrow(
    'Quantity must be positive',
  );
});
```

### 3. Use Meaningful Assertions

```typescript
// Bad
expect(result).toBeTruthy();

// Good
expect(result).toHaveProperty('id');
expect(result.name).toBe('Expected Name');
expect(result.items).toHaveLength(2);
```

### 4. Test Business Logic

Focus on testing business logic, not implementation details.

```typescript
// Test the business rule, not the method call
it('should deduct inventory when sale is created', async () => {
  const result = await useCase.execute(orgId, userId, saleData);

  expect(inventoryService.createBulk).toHaveBeenCalledWith(
    expect.arrayContaining([
      expect.objectContaining({
        movementType: 'SALE',
        qty: expect.any(Number),
      }),
    ]),
  );
});
```

### 5. Keep Tests Fast

- Use mocks instead of real database connections
- Minimize external dependencies
- Run only necessary setup/teardown

### 6. Test Transaction Behavior

For transaction-based operations:

```typescript
it('should rollback on error', async () => {
  mockService.create.mockRejectedValue(new Error('Database error'));

  await expect(useCase.execute(data)).rejects.toThrow();

  // Verify rollback occurred (transaction not committed)
  expect(mockDb.transaction).toHaveBeenCalled();
});
```

## Testing Checklist

When adding new features, ensure you have:

- [ ] Unit tests for use cases
- [ ] Unit tests for services
- [ ] Unit tests for controllers
- [ ] E2E tests for API endpoints
- [ ] Tests for error conditions
- [ ] Tests for validation
- [ ] Tests for transaction rollback
- [ ] Minimum 80% code coverage

## Continuous Integration

Tests run automatically on:

- Every push to feature branches
- Pull requests to main
- Before deployment

### CI Configuration Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - name: Install dependencies
        run: pnpm install
      - name: Run unit tests
        run: pnpm test:cov
      - name: Run E2E tests
        run: pnpm test:e2e
```

## Troubleshooting

### Tests Timeout

Increase Jest timeout:

```typescript
jest.setTimeout(30000); // 30 seconds
```

### Database Connection Issues

Use in-memory database or mocks for unit tests:

```typescript
beforeAll(async () => {
  // Use test database
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
});
```

### Authentication Errors

Mock authentication in tests:

```typescript
jest.mock('@clerk/express', () => ({
  ClerkExpressRequireAuth: () => (req, res, next) => {
    req.auth = { userId: 'test-user', orgId: 'test-org' };
    next();
  },
}));
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

---

For questions or improvements to this guide, please open an issue or PR.
