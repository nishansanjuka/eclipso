# Testing Guide for Eclipso API

## Overview

This directory contains unit tests and end-to-end (E2E) tests for the Eclipso API. The test suite is built using Jest and Supertest.

## Test Structure

```
test/
├── README.md                    # This file
├── TESTING.md                   # Detailed testing guide
├── jest-e2e.json               # E2E test configuration
├── app.e2e-spec.ts             # Main app E2E tests
└── e2e/                        # Module-specific E2E tests
    ├── customer.e2e-spec.ts    # Customer module tests
    ├── sale.e2e-spec.ts        # Sale module tests
    └── return.e2e-spec.ts      # Return module tests
```

## Running Tests

### All Tests
```bash
pnpm test
```

### Unit Tests
```bash
pnpm test:watch
```

### E2E Tests
```bash
pnpm test:e2e
```

### Test Coverage
```bash
pnpm test:cov
```

## Current Test Status

### ✅ Working Tests
- **App Module**: Health check and API documentation
- **Module Registration**: Verifies all modules load correctly

### ⚠️ Limitations

The current E2E tests have limitations due to the authentication architecture:

1. **Clerk Authentication**: The API uses Clerk for authentication, which requires:
   - Valid Clerk API keys
   - Real user accounts
   - Organization setup
   - JWT tokens

2. **No Mock Auth**: There's no mock authentication system for testing

3. **Database Dependency**: Tests require a real database connection

## Test Categories

### 1. Module Loading Tests

These tests verify that modules are properly registered and routes exist:

```typescript
it('should have route registered (not 404)', () => {
  return request(app.getHttpServer())
    .get('/customers/test-id')
    .expect((res) => {
      expect(res.status).not.toBe(404);
    });
});
```

### 2. Input Validation Tests

Tests that verify Zod schema validation works:

```typescript
it('should validate required fields', () => {
  return request(app.getHttpServer())
    .post('/customers/create')
    .send({}) // Missing required fields
    .expect(400);
});
```

### 3. API Documentation Tests

Tests that verify OpenAPI/Swagger documentation is generated:

```typescript
it('/api-json (GET) - should return OpenAPI spec', () => {
  return request(app.getHttpServer())
    .get('/api-json')
    .expect(200)
    .expect('Content-Type', /json/);
});
```

## Future Improvements

### 1. Mock Authentication

Create a test authentication guard that bypasses Clerk:

```typescript
// test/mocks/auth.guard.ts
@Injectable()
export class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = {
      userId: 'test-user-id',
      orgId: 'test-org-id',
    };
    return true;
  }
}
```

### 2. Test Database

Set up a separate test database:

```typescript
// test/setup.ts
beforeAll(async () => {
  // Create test database
  // Run migrations
  // Seed test data
});

afterAll(async () => {
  // Clean up test database
});
```

### 3. Integration Tests

Add full integration tests with:
- Real database transactions
- Test data fixtures
- Complete workflow testing

### 4. Unit Tests for Each Module

Add unit tests for:
- Use cases
- Services
- Repositories
- Entities (Zod validation)

## Example: Adding a New Test

### 1. Create Test File

```typescript
// test/e2e/product.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Product Module (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should have route registered', () => {
    return request(app.getHttpServer())
      .get('/products')
      .expect((res) => {
        expect(res.status).not.toBe(404);
      });
  });
});
```

### 2. Run the Test

```bash
pnpm test:e2e -- product.e2e-spec
```

## Troubleshooting

### Tests Failing with 404

**Problem**: Routes return 404 instead of expected status codes.

**Solution**: 
1. Check that the module is imported in `AppModule`
2. Verify controller is registered in the module
3. Check route paths match the test

### Tests Failing with Class Validator Errors

**Problem**: `class-validator` package missing error.

**Solution**:
```bash
pnpm add class-validator class-transformer
```

### Database Connection Errors

**Problem**: Tests can't connect to database.

**Solution**:
1. Ensure PostgreSQL is running
2. Check `.env` file has correct `DATABASE_URL`
3. Run migrations: `pnpm db:migrate`

### Import Errors

**Problem**: Cannot find module errors.

**Solution**:
1. Remove `.js` extensions from imports
2. Ensure `tsconfig.json` paths are correct
3. Run `pnpm install` to refresh dependencies

## Best Practices

### 1. Test Isolation

Each test should be independent:

```typescript
describe('Customer Creation', () => {
  let createdCustomerId: string;

  afterEach(async () => {
    // Clean up created customer
    if (createdCustomerId) {
      await cleanupCustomer(createdCustomerId);
    }
  });
});
```

### 2. Use Test Data Builders

Create helper functions for test data:

```typescript
// test/helpers/builders.ts
export const buildCustomer = (overrides = {}) => ({
  name: 'Test Customer',
  phone: '+1234567890',
  email: 'test@example.com',
  ...overrides,
});
```

### 3. Descriptive Test Names

Use clear, descriptive names:

```typescript
// ❌ Bad
it('works', () => {});

// ✅ Good
it('should create a customer with valid data', () => {});
it('should return 400 when name is missing', () => {});
```

### 4. Test Both Success and Failure Cases

```typescript
describe('POST /customers/create', () => {
  it('should create customer with valid data', () => {});
  it('should return 400 with invalid email', () => {});
  it('should return 400 with missing required fields', () => {});
  it('should return 401 without authentication', () => {});
});
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](https://testingjavascript.com/)
