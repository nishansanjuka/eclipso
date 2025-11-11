# Eclipso - Point of Sale System

Eclipso is a lightweight, extensible Point-of-Sale (POS) system built for retail and hospitality environments. It provides core POS features and a well-documented API for third-party integrations.

## 🏗️ Architecture

This is a monorepo built with **Turborepo** containing multiple applications and shared packages:

```
eclipso/
├── apps/
│   ├── api/          # NestJS backend API
│   ├── mobile/       # Mobile application
│   ├── nl2sql-service/ # Natural Language to SQL service
│   └── web/          # Web frontend
└── packages/
    ├── api-client-ts/    # TypeScript API client
    ├── eslint-config/    # Shared ESLint configurations
    ├── pdf/             # PDF generation utilities
    ├── types/           # Shared TypeScript types
    ├── typescript-config/ # Shared TypeScript configs
    └── utils/           # Shared utilities
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Python 3.11+ (for NL2SQL service)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd eclipso

# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your configuration

# Create database
pnpm db:create

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

## 📱 Applications

### API (NestJS Backend)

Located in [`apps/api/`](apps/api) - Core backend service providing RESTful APIs for authentication, organization management, and business operations.

**Key Features:**
- Authentication & Authorization via Clerk
- Multi-tenant organization management
- Role-based access control
- Real-time webhook integration
- PostgreSQL with Drizzle ORM

📖 **[View API Documentation](apps/api/README.md)**

### NL2SQL Service (Python/FastAPI)

Located in [`apps/nl2sql-service/`](apps/nl2sql-service) - AI-powered natural language to SQL query service.

**Key Features:**
- Convert natural language questions to SQL queries
- Execute queries and return human-readable answers
- Google Gemini AI integration
- Clerk authentication
- Three-step pipeline: NL → SQL → Data → Answer

📖 **[View NL2SQL Documentation](apps/nl2sql-service/README.md)**

### Mobile App

Located in [`apps/mobile/`](apps/mobile) - React Native mobile application for on-the-go POS operations.

### Web App

Located in [`apps/web/`](apps/web) - React web frontend providing the main POS interface.

## 📦 Packages

### API Client TypeScript

Located in [`packages/api-client-ts/`](packages/api-client-ts)

Type-safe TypeScript client for consuming the Eclipso API with auto-generated DTOs.

```typescript
import { ApiClient } from '@eclipso/api-client-ts';
import { CreateProductDto, UpdateOrderDto } from '@eclipso/api-client-ts/models';

const client = new ApiClient({
  baseUrl: 'http://localhost:3000',
  token: 'your-auth-token'
});
```

**Available Models:**
- Brands: `CreateBrandDto`, `UpdateBrandDto`
- Categories: `CreateCategoryDto`, `UpdateCategoryDto`
- Products: `CreateProductDto`, `UpdateProductDto`
- Suppliers: `CreateSupplierDto`
- Taxes: `CreateTaxDto`, `UpdateTaxDto`
- Discounts: `CreateDiscountDto`, `UpdateDiscountDto`
- Orders: `CreateOrderDto`, `UpdateOrderDto`, `CreateOrderItemDto`, `UpdateOrderItemDto`
- Organizations: `CreateOrganizationDto`, `UpdateOrganizationDto`
- Users: `InviteUserDto`

### PDF Generator

Located in [`packages/pdf/`](packages/pdf)

Utilities for generating PDF documents, including invoices and reports.

```typescript
import { generateInvoicePDF } from '@eclipso/pdf';

const pdfBuffer = await generateInvoicePDF({
  invoiceData: invoice,
  businessInfo: business
});
```

**Features:**
- Invoice PDF generation
- Custom fonts support
- Branded templates
- High-performance rendering

### Shared Types

Located in [`packages/types/`](packages/types)

Common TypeScript types and interfaces used across all applications.

```typescript
import { BusinessType, UserRole, InvoiceData } from '@eclipso/types';
```

**Available Types:**
- Authentication types
- Invoice types and interfaces
- Shared domain types

### ESLint Config

Located in [`packages/eslint-config/`](packages/eslint-config)

Shared ESLint configurations ensuring consistent code style across the monorepo.

Available configs:
- `@eclipso/eslint-config/base` - Base ESLint rules
- `@eclipso/eslint-config/next` - Next.js specific rules
- `@eclipso/eslint-config/react-internal` - Internal React component rules

### TypeScript Config

Located in [`packages/typescript-config/`](packages/typescript-config)

Shared TypeScript configurations for different application types.

Available configs:
- `@eclipso/typescript-config/base.json` - Base TypeScript configuration
- `@eclipso/typescript-config/nextjs.json` - Next.js optimized config
- `@eclipso/typescript-config/react-library.json` - React library config

### Utils

Located in [`packages/utils/`](packages/utils)

Shared utility functions and helpers.

```typescript
import { logDebug } from '@eclipso/utils';

logDebug('Debug message', { data: 'example' });
```

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev              # Start all apps in development mode
pnpm dev:api          # Start only the API server
pnpm dev:web          # Start only the web app
pnpm dev:mobile       # Start only the mobile app

# Building
pnpm build            # Build all applications
pnpm build:api        # Build only the API
pnpm build:web        # Build only the web app

# Testing
pnpm test             # Run all tests
pnpm test:api         # Run API tests
pnpm test:e2e         # Run end-to-end tests

# Database
pnpm db:generate      # Generate database migrations
pnpm db:migrate       # Run database migrations
pnpm db:reset         # Reset database

# Linting & Formatting
pnpm lint             # Lint all packages
pnpm format           # Format all code

# NL2SQL Service (Python)
cd apps/nl2sql-service
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Workspace Structure

Each application and package has its own:
- `package.json` with specific dependencies
- Build configuration
- Test setup
- Environment configuration

Shared configurations are inherited from the packages to maintain consistency.

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run tests for specific workspace
pnpm test:api
pnpm test:web

# Run tests in watch mode
pnpm test:watch
```

### E2E Tests

```bash
# Run end-to-end tests
pnpm test:e2e
```

### Test Coverage

```bash
# Generate coverage report
pnpm test:coverage
```

## 🚀 Deployment

This monorepo uses **GitHub Actions** for Continuous Delivery with separate workflows for each service:

- **NL2SQL Service** → Google Cloud Run (automated Docker deployments)
- **API** → Vercel (serverless deployments)

📖 **[View Detailed Deployment Guide](DEPLOYMENT.md)**

### Quick Deployment Overview

#### NL2SQL Service (Google Cloud Run)

```bash
# Automated on push to main branch
# Manual deployment:
cd apps/nl2sql-service
docker build -t gcr.io/PROJECT_ID/nl2sql-service:latest .
docker push gcr.io/PROJECT_ID/nl2sql-service:latest
gcloud run deploy nl2sql-service --image gcr.io/PROJECT_ID/nl2sql-service:latest
```

**Features:**
- Automatic Docker builds with multi-stage optimization
- Scale-to-zero for cost efficiency
- Secret management via Google Secret Manager
- Health checks and startup probes
- Auto-scaling (0-10 instances)

#### API (Vercel)

```bash
# Automated on push to main branch
# Manual deployment:
pnpm turbo run build --filter=api...
vercel --prod
```

**Features:**
- Turborepo build caching
- Automatic database migrations
- Zero-config deployments
- Edge network distribution
- Preview deployments for PRs

### Environment Setup

1. **Database**: Set up PostgreSQL instance (Neon, Supabase, or managed Postgres)
2. **Authentication**: Configure Clerk application
3. **Cloud Accounts**:
   - Google Cloud Platform (for NL2SQL service)
   - Vercel account (for API)
4. **Secrets Configuration**:
   - GitHub Secrets for CI/CD
   - Google Secret Manager for Cloud Run
   - Vercel environment variables
5. **Migrations**: Run database migrations on first deployment

### GitHub Secrets Required

**For NL2SQL Service:**
- `GCP_PROJECT_ID`: Your Google Cloud project ID
- `GCP_SA_KEY`: Service account JSON key

**For API:**
- `VERCEL_TOKEN`: Vercel deployment token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID
- `DATABASE_URL`: PostgreSQL connection string
- `CLERK_SECRET_KEY`: Clerk secret key
- `CLERK_PUBLISHABLE_KEY`: Clerk publishable key
- `CLERK_WEBHOOK_SECRET`: Clerk webhook secret

**Optional (Turborepo Remote Caching):**
- `TURBO_TOKEN`: Turbo remote cache token
- `TURBO_TEAM`: Turbo team name

### Deployment Workflows

- `.github/workflows/deploy-nl2sql.yml` - Deploys NL2SQL service to Cloud Run
- `.github/workflows/deploy-api.yml` - Deploys API to Vercel
- `.github/workflows/continuous-integration.yml` - CI pipeline for quality checks
- `.github/workflows/pr-validation.yml` - PR validation tests

## 🤝 Contributing

### Getting Started

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`pnpm test`)
6. Lint your code (`pnpm lint`)
7. Commit your changes (`git commit -m 'Add some amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Development Guidelines

- **Code Style**: Follow the existing code style enforced by ESLint and Prettier
- **Testing**: Write tests for new features and bug fixes
- **Documentation**: Update documentation for new features
- **Commits**: Use conventional commit messages
- **Types**: Maintain strong TypeScript typing

### Workspace Guidelines

- Keep shared code in `packages/`
- Application-specific code stays in respective `apps/` directories
- Update shared types when adding new interfaces
- Follow the established architecture patterns

## 📄 License

Copyright (c) 2025 nishansanjuka. All Rights Reserved.

This software is proprietary and confidential. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited without explicit written permission from the copyright holder.

See the [LICENSE](LICENSE) file for full details.

## 📞 Support

For support and questions:

- 📚 Check the documentation in each app's README
- 🐛 Create an issue on GitHub for bugs
- 💡 Open a discussion for feature requests
- 📧 Contact the development team

## 🗺️ Roadmap

### Current Phase - Core Infrastructure
- [x] Authentication system with Clerk
- [x] Multi-tenant organization management
- [x] Database schema and migrations
- [x] API foundation

### Next Phase - POS Core Features
- [x] Product catalog and pricing
- [x] Brand management
- [x] Supplier management
- [x] Tax configuration
- [x] Discount system
- [x] Order processing and management
- [x] Invoice generation with PDF export
- [ ] Inventory tracking (in progress)
- [ ] Payment processing integration
- [ ] Customer management

### Future Phases
- [ ] Advanced reporting and analytics
- [ ] Mobile app enhancements
- [ ] Third-party integrations (payment processors, accounting)
- [ ] Advanced inventory features (stock tracking, alerts)
- [ ] Multi-location support
- [ ] Offline mode capabilities

## 📋 Project Status

- **API**: ✅ Core features complete (Auth, Products, Orders, Invoices, Inventory)
- **NL2SQL Service**: ✅ AI-powered natural language queries with Gemini
- **Packages**: ✅ TypeScript client, PDF generator, shared utilities
- **Web App**: 🚧 In development
- **Mobile App**: 📋 Planned
- **Documentation**: ✅ Comprehensive API docs with Postman sync
- **Testing**: ✅ Unit tests and E2E tests implemented
- **CI/CD**: ✅ Automated deployments (Cloud Run + Vercel)

---

**Getting Started?** Head to the [API Documentation](apps/api/README.md) to explore the available endpoints and start building with Eclipso.