# Phase 1 — Foundation

> Prisma schema and database client setup — the data contract for the entire system.

## What's been built

The database schema defines the core data models for the POS system:

**Models implemented:**
- **Category** — product organization
- **Product** — SKU, barcode, pricing, stock levels, category
- **Customer** — contact info and loyalty points
- **Order** — completed transactions with status tracking
- **OrderItem** — line items linking orders to products
- **User** — system operators with roles (admin, manager, cashier)

**Infrastructure:**
- Prisma schema in [`prisma/schema.prisma`](../../prisma/schema.prisma)
- Prisma singleton client in [`lib/prisma.ts`](../../lib/prisma.ts)
- Generated Prisma client in [`app/generated/prisma/`](../../app/generated/prisma/)
- PostgreSQL database connection via Prisma driver adapter

## Database schema

```prisma
model Category {
  id       Int       @id @default(autoincrement())
  name     String    @unique
  products Product[]
}

model Product {
  id          Int      @id @default(autoincrement())
  name        String
  sku         String   @unique           // unique identifier for scanning
  barcode     String?  @unique           // physical barcode (optional)
  description String?
  price       Decimal  @db.Decimal(10,2) // selling price
  cost        Decimal? @db.Decimal(10,2) // cost price (for margin calculations)
  stock       Int      @default(0)       // current stock level
  lowStockThreshold Int @default(10)     // alert when stock falls below this
  isActive    Boolean  @default(true)    // soft delete
  categoryId  Int?
  category    Category? @relation(fields: [categoryId], references: [id])
}

model Customer {
  id             Int     @id @default(autoincrement())
  name           String
  email          String? @unique
  phone          String?
  loyaltyPoints  Int     @default(0)
  orders         Order[]
}

model Order {
  id            Int      @id @default(autoincrement())
  orderNumber   String   @unique         // human-readable order ID
  subtotal      Decimal  @db.Decimal(10,2)
  tax           Decimal  @db.Decimal(10,2)
  total         Decimal  @db.Decimal(10,2)
  paymentMethod String   // cash, card, mobile, etc.
  status        String   @default("completed") // completed, refunded, voided
  notes         String?
  customerId    Int?
  customer      Customer? @relation(fields: [customerId], references: [id])
  items         OrderItem[]
}

model OrderItem {
  id        Int     @id @default(autoincrement())
  quantity  Int
  price     Decimal @db.Decimal(10,2) // price at time of sale
  total     Decimal @db.Decimal(10,2)
  orderId   Int
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId Int
  product   Product @relation(fields: [productId], references: [id])
}

model User {
  id       Int    @id @default(autoincrement())
  name     String
  email    String @unique
  role     String @default("cashier") // admin, manager, cashier
  isActive Boolean @default(true)
}
```

**Key design decisions:**

- **Decimal types for money** — prevents floating-point rounding errors
- **SKU uniqueness** — essential for barcode scanning and product lookup
- **Order status tracking** — supports completed, refunded, and voided states
- **Soft deletes** — `isActive` flag preserves data integrity
- **Indexing** — optimized for common queries (sku, email, order lookups)

## Prisma client singleton

```ts
// lib/prisma.ts
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
```

**Why the singleton?** Prevents connection pool exhaustion during Next.js hot-reloads in development.

## Not yet implemented

- ❌ Authentication & user management
- ❌ Product CRUD interface
- ❌ Inventory management
- ❌ POS checkout interface
- ❌ Transaction history & reporting
- ❌ Search functionality
- ❌ Receipt generation

## Files to explore

- [`prisma/schema.prisma`](../../prisma/schema.prisma) — Database schema
- [`lib/prisma.ts`](../../lib/prisma.ts) — Prisma client singleton
- [`app/generated/prisma/`](../../app/generated/prisma/) — Generated client types

---

*Last updated: 2026-07-06 after foundation setup*
