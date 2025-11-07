# Eclipso API

The Eclipso API is a NestJS-based backend service that provides RESTful endpoints for the Eclipso Point-of-Sale system. It handles authentication, organization management, and core business operations with support for multi-tenancy and real-time synchronization.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+

### Installation

```bash
# From the root directory
cd apps/api

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Create database
pnpm db:create

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

The API will be available at `http://localhost:3000`

## 📋 Environment Variables

Create a `.env` file in the `apps/api` directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/eclipso

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
CLERK_ORG_INVITE_REDIRECT_URL=http://localhost:3000/invite

# Application
PORT=3000
NODE_ENV=development
```

## 🏗️ Architecture

The API follows Clean Architecture principles with clear separation of concerns:

```
src/
├── modules/
│   ├── auth/              # Authentication & Authorization
│   │   ├── application/   # Use cases & business logic
│   │   ├── domain/        # Entities & domain models
│   │   ├── dto/          # Data transfer objects
│   │   ├── enums/        # Domain enums
│   │   ├── infrastructure/ # External services (Clerk)
│   │   └── presentation/  # Controllers & routes
│   ├── adjustment/       # Inventory adjustments & stock corrections
│   ├── audit/            # Audit logging & tracking
│   ├── brand/            # Brand management
│   ├── business/         # Business/Organization management
│   ├── customer/         # Customer management & CRM
│   ├── discount/         # Discount & promotion management
│   ├── inventory/        # Inventory tracking & management
│   ├── invoice/          # Invoice generation & management
│   ├── order/            # Purchase order processing & management
│   ├── payment/          # Payment processing & tracking
│   ├── product/          # Product catalog management
│   ├── return/           # Product returns & refunds
│   ├── sale/             # Sales transactions & POS
│   ├── suppliers/        # Supplier management
│   ├── tax/              # Tax configuration & calculation
│   └── users/            # User management
├── shared/               # Shared application code
│   ├── database/         # Database configuration & migrations
│   ├── decorators/       # Custom decorators
│   ├── middleware/       # Custom middleware
│   ├── services/         # Shared services
│   ├── validators/       # Input validation
│   └── zod/              # Zod schemas
```

### Key Design Patterns

- **Clean Architecture**: Separation of business logic from infrastructure
- **Dependency Injection**: NestJS built-in DI container
- **Repository Pattern**: Data access abstraction
- **Use Case Pattern**: Encapsulated business operations
- **Decorator Pattern**: Custom decorators for authentication and validation

## 📡 API Endpoints

### Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://api.eclipso.example.com`

### API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:3000/api`
- **Scalar API Reference**: `http://localhost:3000/reference`
- **OpenAPI JSON**: `http://localhost:3000/api-json`

### Authentication

All API endpoints require authentication via Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/endpoint
```

### Available Modules

The API provides the following feature modules:

#### Core Modules
- **Authentication & Authorization** - User authentication, organization management, and access control
- **Users** - User profile and account management
- **Business** - Multi-tenant business/organization management
- **Audit** - Audit logging and activity tracking

#### Product & Inventory Management
- **Brands** - Brand catalog and management
- **Products** - Product catalog, variants, and pricing
- **Inventory** - Real-time stock tracking with movement history
- **Adjustment** - Stock adjustments and corrections

#### Supplier & Procurement
- **Suppliers** - Supplier information and relationship management
- **Orders** - Purchase order creation, processing, and fulfillment

#### Sales & Customer Management
- **Customer** - Customer information and relationship management
- **Sale** - Point-of-sale transactions with automatic inventory deduction
- **Payment** - Payment processing and tracking for sales
- **Return** - Product returns with automatic inventory restoration and refunds

#### Financial Management
- **Taxes** - Tax configuration, rates, and calculations
- **Discounts** - Promotional discounts and pricing rules
- **Invoices** - Invoice generation, PDF export, and history

#### Organization Management

##### Create Organization
```http
POST /auth/clerk/organization
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "My Business",
  "businessType": "retail"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "org_123456789",
    "name": "My Business",
    "businessType": "retail",
    "createdAt": "2025-10-27T10:00:00Z"
  }
}
```

##### Update Organization
```http
PUT /auth/clerk/organization
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "Updated Business Name",
  "businessType": "hospitality"
}
```

##### Delete Organization
```http
DELETE /auth/clerk/organization
Authorization: Bearer YOUR_TOKEN
```

##### Invite User to Organization
```http
POST /auth/clerk/organization/invite
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "emails": ["user@example.com", "another@example.com"],
  "role": "org:member"
}
```

##### Remove User from Organization
```http
DELETE /auth/clerk/organization/user/:userId
Authorization: Bearer YOUR_TOKEN
```

#### Webhooks

##### Clerk Webhook Handler
```http
POST /auth/webhook
Content-Type: application/json
Svix-Id: webhook_id
Svix-Timestamp: timestamp
Svix-Signature: signature

{
  "type": "user.created",
  "data": { ... }
}
```

**Supported Webhook Events:**
- `user.created` - Create user in local database
- `organization.created` - Create business in local database
- `organization.updated` - Update business information
- `organization.deleted` - Delete business and related data
- `organizationMembership.deleted` - Remove user from business

#### Customer Management

##### Create Customer
```http
POST /customers/create
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "id": "uuid",
  "businessId": "uuid",
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "createdAt": "2025-11-08T10:00:00Z",
  "updatedAt": "2025-11-08T10:00:00Z"
}
```

##### Get Customer
```http
GET /customers/:id
Authorization: Bearer YOUR_TOKEN
```

##### Update Customer
```http
PATCH /customers/:id
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

##### Delete Customer
```http
DELETE /customers/:id
Authorization: Bearer YOUR_TOKEN
```

#### Sales Management

##### Create Sale
Creates a complete sale transaction with automatic inventory deduction and payment processing.

```http
POST /sales/create
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "customerId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "qty": 2,
      "price": "29.99",
      "discountId": "uuid",
      "taxId": "uuid"
    }
  ],
  "payment": {
    "method": "CASH",
    "amount": "65.98",
    "transactionRef": "TXN-2025-001"
  }
}
```

**Process Flow:**
1. Validates customer and products belong to business
2. Creates sale record with calculated totals
3. Creates sale items for each product
4. Creates inventory movements (negative qty for stock deduction)
5. Updates product stock levels atomically
6. Creates payment record
7. All operations in a single database transaction

**Response:**
```json
{
  "sale": {
    "id": "uuid",
    "businessId": "uuid",
    "customerId": "uuid",
    "userId": "uuid",
    "totalAmount": "65.98",
    "createdAt": "2025-11-08T10:00:00Z"
  },
  "items": [...],
  "inventoryMovements": [...],
  "payment": {...}
}
```

##### Get Sale
```http
GET /sales/:id
Authorization: Bearer YOUR_TOKEN
```

**Response includes:**
- Sale details
- Sale items with product information
- Payment information
- Customer details

##### Update Sale
```http
PATCH /sales/:id
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "customerId": "uuid"
}
```

##### Delete Sale
```http
DELETE /sales/:id
Authorization: Bearer YOUR_TOKEN
```

**Note:** Deleting a sale cascades to delete sale items and payment records.

#### Payment Management

Payments are automatically created with sales but can be queried separately.

##### Payment Methods
- `CASH` - Cash payment
- `CARD` - Card payment (credit/debit)
- `BANK_TRANSFER` - Bank transfer
- `MOBILE_MONEY` - Mobile money payment
- `OTHER` - Other payment methods

##### Payment Status
- `PENDING` - Payment initiated
- `COMPLETED` - Payment successful
- `FAILED` - Payment failed
- `REFUNDED` - Payment refunded

#### Returns & Refunds Management

##### Create Return
Creates a product return with automatic inventory restoration and optional refund.

```http
POST /returns/create
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "saleId": "uuid",
  "qty": 1,
  "reason": "DEFECTIVE",
  "status": "PENDING",
  "notes": "Product stopped working",
  "items": [
    {
      "saleItemId": "uuid",
      "qtyReturned": 1
    }
  ],
  "refund": {
    "method": "CASH",
    "amount": "29.99",
    "reason": "Defective product",
    "transactionRef": "REFUND-2025-001"
  }
}
```

**Process Flow:**
1. Validates sale exists and belongs to business
2. Validates return items exist in original sale
3. Validates return quantities don't exceed purchased quantities
4. Creates return record
5. Creates return items
6. Creates inventory movements (positive qty for stock restoration)
7. Updates product stock levels (increments stock)
8. Creates refund record (optional)
9. All operations in a single database transaction

**Response:**
```json
{
  "return": {
    "id": "uuid",
    "saleId": "uuid",
    "userId": "uuid",
    "qty": 1,
    "reason": "DEFECTIVE",
    "status": "PENDING",
    "notes": "Product stopped working",
    "createdAt": "2025-11-08T10:00:00Z"
  },
  "items": [...],
  "inventoryMovements": [...],
  "refund": {...}
}
```

##### Return Reasons
- `DEFECTIVE` - Product is defective
- `WRONG_ITEM` - Wrong item delivered
- `NOT_AS_DESCRIBED` - Product not as described
- `CHANGED_MIND` - Customer changed mind
- `DAMAGED` - Product arrived damaged
- `OTHER` - Other reason

##### Return Status
- `PENDING` - Return initiated, awaiting processing
- `APPROVED` - Return approved
- `REJECTED` - Return rejected
- `COMPLETED` - Return completed

##### Refund Methods
- `CASH` - Cash refund
- `CARD` - Card refund
- `BANK_TRANSFER` - Bank transfer
- `STORE_CREDIT` - Store credit

##### Get Return
```http
GET /returns/:id
Authorization: Bearer YOUR_TOKEN
```

**Response includes:**
- Return details
- Return items with sale item references
- Refund information (if applicable)
- Inventory movement records

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Businesses Table
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  org_id TEXT NOT NULL UNIQUE,
  business_type business_type_enum NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Business Users Junction Table
```sql
CREATE TABLE business_users (
  user_id TEXT REFERENCES users(clerk_id) ON DELETE CASCADE,
  business_id TEXT REFERENCES businesses(org_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, business_id)
);
```

### Customers Table
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Sales Table
```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  total_amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Sale Items Table
```sql
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  qty INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  discount_id UUID REFERENCES discounts(id),
  tax_id UUID REFERENCES taxes(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL UNIQUE REFERENCES sales(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  method payment_method_enum NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status payment_status_enum NOT NULL DEFAULT 'COMPLETED',
  transaction_ref TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Returns Table
```sql
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id),
  user_id UUID NOT NULL REFERENCES users(id),
  qty INTEGER NOT NULL,
  reason return_reason_enum NOT NULL,
  status return_status_enum NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Return Items Table
```sql
CREATE TABLE return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  sale_item_id UUID NOT NULL REFERENCES sale_items(id),
  qty_returned INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Refunds Table
```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL UNIQUE REFERENCES returns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  method refund_method_enum NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  reason TEXT,
  transaction_ref TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Inventory Movements Table
```sql
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  order_id UUID REFERENCES orders(id),
  sale_id UUID REFERENCES sales(id),
  adjustment_id UUID REFERENCES adjustments(id),
  qty INTEGER NOT NULL,
  movement_type inventory_movement_type_enum NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Enums
```sql
-- Business type
CREATE TYPE business_type_enum AS ENUM ('retail', 'hospitality', 'service', 'other');

-- Payment related
CREATE TYPE payment_method_enum AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'OTHER');
CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- Return related
CREATE TYPE return_reason_enum AS ENUM ('DEFECTIVE', 'WRONG_ITEM', 'NOT_AS_DESCRIBED', 'CHANGED_MIND', 'DAMAGED', 'OTHER');
CREATE TYPE return_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');
CREATE TYPE refund_method_enum AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'STORE_CREDIT');

-- Inventory related
CREATE TYPE inventory_movement_type_enum AS ENUM ('PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT');
```

### Database Commands

```bash
# Generate new migration
pnpm db:generate

# Run migrations
pnpm db:migrate

# Reset database (development only)
pnpm db:reset

# View database studio
pnpm db:studio
```

## � Postman Integration

### Automated Collection Sync

The API includes an automated Postman collection sync feature that keeps your Postman workspace in sync with the latest API changes. This feature automatically:

1. Downloads the OpenAPI specification from your running API
2. Converts it to a Postman collection
3. Injects authentication pre-request scripts
4. Syncs the collection to your Postman workspace

### Setup

#### 1. Get Your Postman API Key

1. Go to [Postman Account Settings](https://go.postman.co/settings/me/api-keys)
2. Generate a new API key
3. Copy the key

#### 2. Get Your Collection ID

1. Open your Postman workspace
2. Navigate to the collection you want to sync
3. Click the three dots (•••) next to the collection name
4. Select "Share" → "Via API" → Copy the Collection ID

#### 3. Configure Environment Variables

Add these to your `.env` file:

```bash
# Postman Sync Configuration
API_JSON_URL=http://localhost:3000/api-json
POSTMAN_API_KEY=PMAK-your-api-key-here
POSTMAN_COLLECTION_ID=your-collection-id-here
```

#### 4. Sync the Collection

```bash
# Start your API server first
pnpm dev

# In another terminal, run the sync command
pnpm sync:postman
```

**Expected Output:**
```
🔧 Reading collection: C:\Users\...\Temp\collection.json
✅ Postman collection patched with pre-request script!
✅✅✅ Synced collection to Postman!
```

### Authentication Pre-Request Script

The sync process automatically injects a pre-request script that:

1. **Creates a Clerk session** using your test user ID
2. **Activates the organization** (if the user belongs to one)
3. **Generates a JWT token** for authentication
4. **Sets the bearer token** in your Postman environment

This means you don't need to manually obtain and update tokens for each request!

### Postman Environment Setup

Import the development environment template:

1. Locate `scripts/postman-env-dev.json`
2. Import it into Postman (Environments → Import)
3. Update the environment variables:

```json
{
  "baseUrl": "http://localhost:3000",
  "CLERK_SECRET_KEY": "sk_test_your_secret_key",
  "TEST_CLERK_USER_ID": "user_your_test_user_id",
  "bearerToken": "" // Auto-populated by pre-request script
}
```

### How It Works

The `sync:postman` script performs the following steps:

```powershell
# 1. Download OpenAPI spec
Invoke-WebRequest $env:API_JSON_URL -OutFile "$env:TEMP\openapi.json"

# 2. Convert OpenAPI to Postman collection
npx openapi2postmanv2 -s "$env:TEMP\openapi.json" -o "$env:TEMP\collection.json"

# 3. Inject pre-request script
node ./scripts/patch-postman.mjs

# 4. Upload to Postman
Invoke-RestMethod -Uri "https://api.getpostman.com/collections/$env:POSTMAN_COLLECTION_ID" -Method PUT
```

### Script Files

- **`scripts/patch-postman.mjs`** - Injects the pre-request script into the collection
- **`scripts/pre-request.js`** - Authentication flow for automatic token generation
- **`scripts/postman-env-dev.json`** - Development environment template

### Usage Tips

#### Automatic Token Refresh

The pre-request script runs before **every** request, ensuring your token is always fresh. No manual token management needed!

#### Multiple Environments

Create separate Postman environments for different stages:

- **Development**: `http://localhost:3000`
- **Staging**: `https://staging-api.eclipso.example.com`
- **Production**: `https://api.eclipso.example.com`

Each environment should have its own:
- `CLERK_SECRET_KEY`
- `TEST_CLERK_USER_ID`
- `baseUrl`

#### Troubleshooting Sync

**Collection not found:**
```bash
# Ensure API is running
pnpm dev

# Verify API_JSON_URL is accessible
curl http://localhost:3000/api-json
```

**Authentication errors:**
```bash
# Verify Clerk credentials in Postman environment
# Check that TEST_CLERK_USER_ID exists in your Clerk dashboard
# Ensure CLERK_SECRET_KEY has proper permissions
```

**Pre-request script not working:**
- Check the Postman console (View → Show Postman Console)
- Verify environment variables are set correctly
- Ensure the test user has organization membership (if required)

### Continuous Integration

For CI/CD pipelines, you can automate collection syncing:

```yaml
# .github/workflows/sync-postman.yml
name: Sync Postman Collection

on:
  push:
    branches: [main]
    paths:
      - 'apps/api/src/**'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      
      - name: Start API
        run: |
          cd apps/api
          pnpm install
          pnpm dev &
          sleep 10
      
      - name: Sync to Postman
        env:
          API_JSON_URL: http://localhost:3000/api-json
          POSTMAN_API_KEY: ${{ secrets.POSTMAN_API_KEY }}
          POSTMAN_COLLECTION_ID: ${{ secrets.POSTMAN_COLLECTION_ID }}
        run: |
          cd apps/api
          pnpm sync:postman
```

### Benefits

✅ **Always Up-to-Date** - Postman collection stays in sync with your API  
✅ **No Manual Token Management** - Automatic authentication for every request  
✅ **Team Collaboration** - Share collections with consistent authentication  
✅ **Multi-Organization Support** - Automatically activates user's default organization  
✅ **OpenAPI Standard** - Uses industry-standard OpenAPI specification  

## �🔐 Authentication & Authorization

### Clerk Integration

The API uses [Clerk](https://clerk.dev) for authentication and organization management.

#### Key Concepts

- **Users**: Individual people using the system
- **Organizations**: Business entities (multi-tenant support)
- **Roles**: 
  - `org:admin` - Full organization access
  - `org:member` - Limited organization access
- **Permissions**: Fine-grained access control (coming soon)

#### Middleware

##### Auth Middleware
Validates JWT tokens and extracts user information.

```typescript
// Protect routes with auth middleware
@UseGuards(AuthGuard)
@Controller('protected')
export class ProtectedController {
  @Get()
  getData(@CurrentUser() user: User) {
    return user;
  }
}
```

##### Webhook Middleware
Validates Clerk webhook signatures.

```typescript
// Automatically applied to webhook routes
@Post('webhook')
handleWebhook(@Body() payload: WebhookPayload) {
  // Process verified webhook
}
```

## 🧪 Testing

### Running Tests

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov

# E2E tests
pnpm test:e2e
```

### Test Structure

```
test/
├── app.e2e-spec.ts      # End-to-end tests
├── jest-e2e.json        # E2E Jest configuration
└── ...

src/
├── **/*.spec.ts         # Unit tests alongside source files
```

### Example Test

```typescript
describe('AuthController', () => {
  let controller: AuthController;
  let authUseCase: AuthUseCase;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthUseCase,
          useValue: {
            createOrganization: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authUseCase = module.get<AuthUseCase>(AuthUseCase);
  });

  it('should create organization', async () => {
    const dto = { name: 'Test Org', businessType: 'retail' };
    await controller.createOrganization(dto, mockUser);
    expect(authUseCase.createOrganization).toHaveBeenCalledWith(
      dto.name,
      mockUser.id,
      dto.businessType
    );
  });
});
```

## 🚀 Development

### Available Scripts

```bash
# Development
pnpm dev                 # Start development server with hot reload
pnpm start:debug         # Start with debug mode

# Building
pnpm build               # Build for production
pnpm start:prod          # Start production server

# Database
pnpm db:generate         # Generate migration from schema changes
pnpm db:migrate          # Apply migrations
pnpm db:studio           # Open database studio
pnpm db:reset            # Reset database (dev only)

# Testing
pnpm test                # Run unit tests
pnpm test:watch          # Run tests in watch mode
pnpm test:cov            # Run tests with coverage
pnpm test:e2e            # Run E2E tests

# Code Quality
pnpm lint                # Lint code
pnpm format              # Format code with Prettier
```

### Hot Reload

The development server includes hot reload for rapid development:

```bash
pnpm dev
# Server automatically restarts on file changes
```

### Debugging

#### VS Code Debug Configuration

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug NestJS",
  "program": "${workspaceFolder}/apps/api/src/main.ts",
  "outFiles": ["${workspaceFolder}/apps/api/dist/**/*.js"],
  "envFile": "${workspaceFolder}/apps/api/.env"
}
```

#### Debug Mode

```bash
pnpm start:debug
# Debugger listening on ws://127.0.0.1:9229/
```

## 📦 Dependencies

### Core Dependencies

- **NestJS** - Progressive Node.js framework
- **Drizzle ORM** - TypeScript ORM for PostgreSQL
- **@clerk/backend** - Clerk authentication SDK
- **Zod** - Schema validation library
- **PostgreSQL** - Primary database

### Development Dependencies

- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type safety

## 🔧 Configuration

### NestJS Configuration

```typescript
// src/app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: configValidationSchema,
    }),
    TaxModule,
    UsersModule,
    AuthModule,
    BusinessModule,
    SuppliersModule,
    ProductModule,
    DiscountModule,
    OrderModule,
    BrandModule,
    InvoiceModule,
    AuditModule,
    AdjustmentModule,
    CustomerModule,
    SaleModule,
    ReturnModule,
  ],
})
export class AppModule {}
```

### Database Configuration

```typescript
// src/shared/database/drizzle.config.ts
export default {
  schema: './src/shared/database/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
} satisfies Config;
```

## 📊 Monitoring & Logging

### Logging

The API includes structured logging:

```typescript
import { Logger } from '@nestjs/common';

const logger = new Logger('AuthService');
logger.log('Organization created', { orgId, userId });
logger.error('Failed to create organization', error.stack);
```

### Health Checks

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "clerk": { "status": "up" }
  }
}
```

## 🚀 Deployment

### Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start:prod
```

### Environment Setup

1. Set up PostgreSQL database
2. Configure Clerk application and webhooks
3. Set environment variables
4. Run database migrations
5. Build and deploy application

### Docker Support (Coming Soon)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

## 🤝 Contributing

### Code Style

- Follow existing TypeScript and NestJS patterns
- Use dependency injection
- Write comprehensive tests
- Follow Clean Architecture principles

### Adding New Features

1. Create feature module in `src/modules/`
2. Implement domain entities and DTOs
3. Create use cases for business logic
4. Add infrastructure services
5. Create controllers for API endpoints
6. Add comprehensive tests
7. Update documentation

### Database Changes

1. Modify schema in `src/shared/database/schema.ts`
2. Generate migration: `pnpm db:generate`
3. Review generated migration
4. Apply migration: `pnpm db:migrate`

## 📝 API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    // Optional metadata (pagination, etc.)
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      // Additional error details
    }
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Error
```bash
# Check database is running
pg_isready -h localhost -p 5432

# Verify connection string
echo $DATABASE_URL
```

#### Clerk Authentication Error
```bash
# Verify Clerk environment variables
echo $CLERK_SECRET_KEY
echo $CLERK_PUBLISHABLE_KEY
```

#### Migration Issues
```bash
# Reset database (development only)
pnpm db:reset

# Re-run migrations
pnpm db:migrate
```

### Debug Logs

Enable debug logging:

```bash
# Set log level
export LOG_LEVEL=debug
pnpm dev
```

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Clerk Documentation](https://clerk.dev/docs)
- [Zod Documentation](https://zod.dev/)

---

For general project information, see the [main README](../../README.md).