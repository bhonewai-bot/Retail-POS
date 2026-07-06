# External Integrations

**Analysis Date:** 2026-07-06

## APIs & External Services

**None currently implemented:**
- No API routes configured (`app/api/` not present)
- No external API calls in source code
- No webhook endpoints configured

## Data Storage

**Databases:**
- PostgreSQL
  - Connection: `DATABASE_URL` environment variable
  - Client: Prisma 7.8.0 with `@prisma/adapter-pg`
  - Schema: `prisma/schema.prisma`
  - Models: `Category`, `Product`, `Customer`, `Order`, `OrderItem`, `User`
  - Connection pooling: Prisma managed
  - SSL: Required (`sslmode=require` in connection string)
  - Output: `app/generated/prisma/` (auto-generated Prisma client)

**File Storage:**
- Local filesystem only (Next.js public directory)
- Location: `/public/` (contains SVG assets)
- No cloud storage configured

**Caching:**
- None configured

## Authentication & Identity

**Auth Provider:**
- None configured
- Schema defines `User` model with roles:
  - `admin` - Full access
  - `manager` - Management access
  - `cashier` - POS terminal access
  - Default: `cashier`
  - Fields: `name`, `email`, `role`, `isActive`
- No authentication middleware present

## Payment Processing

**Schema Support:**
- Order model includes `paymentMethod` field (String)
- Supported values in schema: `cash`, `card`, `mobile` (extensible)
- No payment gateway SDK configured
- No Stripe, Square, PayPal, or other payment integrations

## Monitoring & Observability

**Error Tracking:**
- None configured (no Sentry, LogRocket, or similar)

**Logs:**
- Console output only (seen in `scripts/test-database.ts`)
- No structured logging framework

**Performance Monitoring:**
- None configured

## CI/CD & Deployment

**Hosting:**
- Vercel (suggested by README)
- Compatible with any Node.js hosting (AWS, GCP, Azure, etc.)

**CI Pipeline:**
- None configured (no GitHub Actions, GitLab CI, or similar)

**Build Process:**
- Next.js production build (`npm run build`)
- Prisma client generation (`prisma generate`)
- TypeScript compilation
- Static asset optimization

## Environment Configuration

**Required environment variables:**
- `DATABASE_URL` - PostgreSQL connection string
- Format: `postgres://[user]:[password]@[host]:[port]/[database]?sslmode=require`

**Optional environment variables:**
- `NODE_ENV` - Environment mode (development/production)
- `NEXT_PUBLIC_*` - Client-side exposed variables (none currently)

**Secrets location:**
- `.env` file (local development)
- Environment variables in hosting platform (production)
- Not committed to git (`.env` should be in `.gitignore`)

## Webhooks & Callbacks

**Incoming:**
- None configured

**Outgoing:**
- None configured

## Database Schema

**Models defined in `prisma/schema.prisma`:**

```typescript
// Category
- id, name (unique), createdAt, updatedAt
- Relations: products[]

// Product
- id, name, sku (unique), barcode (unique, optional), description
- price (Decimal 10,2), cost (Decimal 10,2, optional), stock, lowStockThreshold
- isActive, categoryId (optional), createdAt, updatedAt
- Relations: category?, orderItems[]

// Customer
- id, name, email (unique, optional), phone (optional), loyaltyPoints
- createdAt, updatedAt
- Relations: orders[]

// Order
- id, orderNumber (unique), subtotal, tax, total (Decimal 10,2)
- paymentMethod, status ("completed" default), notes (optional)
- customerId (optional), createdAt, updatedAt
- Relations: customer?, items[]

// OrderItem
- id, quantity, price, total (Decimal 10,2)
- orderId, productId, createdAt
- Relations: order, product

// User
- id, name, email (unique), role (default "cashier"), isActive
- createdAt, updatedAt
```

## Database Operations Available

**CRUD Operations:**
- Create, Read, Update, Delete for all models
- Upsert operations (tested in `scripts/test-database.ts`)
- Relation queries (include relations)
- Aggregate functions (count)

**Test Script:**
- `scripts/test-database.ts` - Validates database connection and operations
- Tests: connection, create upsert, order creation, summary queries

## Future Integration Points

**Potential integrations:**
- Payment gateways (Stripe, Square, PayPal)
- Email service (SendGrid, AWS SES)
- SMS service (Twilio)
- Analytics (Google Analytics, Mixpanel)
- Monitoring (Sentry, DataDog)
- Cloud storage (AWS S3, Google Cloud Storage)
- Print service (for POS receipts)

**Current gaps:**
- No external API integrations
- No payment processing
- No email/SMS notifications
- No monitoring or error tracking
- No file upload/storage
- No authentication middleware

---

*Integration audit: 2026-07-06*
