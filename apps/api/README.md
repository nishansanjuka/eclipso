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
│   ├── business/         # Business/Organization management
│   └── users/           # User management
├── shared/              # Shared application code
│   ├── database/        # Database configuration & migrations
│   ├── decorators/      # Custom decorators
│   ├── middleware/      # Custom middleware
│   ├── services/        # Shared services
│   ├── validators/      # Input validation
│   └── zod/            # Zod schemas
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

### Authentication

All API endpoints require authentication via Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/endpoint
```

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

### Enums
```sql
CREATE TYPE business_type_enum AS ENUM ('retail', 'hospitality', 'service', 'other');
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

## 🔐 Authentication & Authorization

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
    DrizzleModule,
    AuthModule,
    BusinessModule,
    UsersModule,
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