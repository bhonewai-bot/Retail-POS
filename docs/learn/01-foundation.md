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
- Prisma singleton client in [`src/lib/prisma.ts`](../../src/lib/prisma.ts)
- Generated Prisma client in [`src/generated/prisma/`](../../src/generated/prisma/)
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
import { PrismaClient } from "../src/generated/prisma/client";
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

## Design system (shadcn)

Phase 2 built 9 pages with raw Tailwind CSS. For Phase 3 onward, **shadcn** provides a consistent component library and design token system.

**Setup:**
```bash
npx shadcn@latest init --preset b1fyMgCu0e --template next
```

**Preset details:**
| Setting | Value |
|---------|-------|
| Style | vega (base-vega) |
| Base color | zinc |
| Theme | zinc |
| Chart color | pink |
| Icon library | Lucide |
| Font (body) | Inter (`--font-sans`) |
| Font (headings) | Roboto (`--font-heading`) |
| Border radius | 0.625rem default |

**Key files:**
- `components.json` — shadcn configuration (aliases, registry style)
- `src/app/globals.css` — CSS custom properties (oklch color space, light/dark mode tokens)
- `src/lib/utils.ts` — `cn()` helper (clsx + twMerge for conditional class names)
- `src/components/ui/` — shadcn component directory (button installed)

**How the token system works:**

shadcn defines semantic color tokens as CSS variables in `globals.css`:

```
--background    → page background (white in light, dark in dark mode)
--foreground    → primary text color
--card          → card surface background
--primary       → primary action color (CTAs, focus rings)
--destructive   → destructive actions (red accent)
--muted         → secondary surfaces, subtle backgrounds
--border        → borders and dividers
```

Components consume these tokens via Tailwind utility classes (`bg-primary`, `text-destructive`, `border-border`) — never raw hex values. This makes theming and dark mode automatic.

**Installed components:**

```bash
npx shadcn add button   # installed during init
```

Future components (Phase 3+): `input`, `table`, `badge`, `dialog`, `label`, `select`, `card`, `separator`.

**Transition note:** Existing pages from Phases 1-2 use raw Tailwind classes (`bg-blue-600`, `text-gray-900`). New pages use shadcn tokens (`bg-primary`, `text-foreground`). Both coexist — no migration needed.

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
- [`src/generated/prisma/`](../../src/generated/prisma/) — Generated client types

---

*Last updated: 2026-07-06 after foundation setup*
