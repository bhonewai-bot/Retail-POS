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

Phases 1-2 built pages with raw Tailwind CSS. The UI foundation establishes **shadcn** as the shared component library and design token system for all future pages.

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
- `src/components/ui/` — shadcn component directory

### Token system

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

### Shared components

All shadcn components are installed once under `src/components/ui/` and imported by both admin and cashier pages:

```bash
npx shadcn add button input table badge card dialog select label separator
```

| Component | File | Purpose |
|-----------|------|---------|
| Button | `src/components/ui/button.tsx` | All CTAs, action triggers |
| Input | `src/components/ui/input.tsx` | Search fields, form inputs |
| Table | `src/components/ui/table.tsx` | Product lists, inventory, transaction history |
| Badge | `src/components/ui/badge.tsx` | Stock status, order status indicators |
| Card | `src/components/ui/card.tsx` | Dashboard tiles, content containers |
| Dialog | `src/components/ui/dialog.tsx` | Confirmations, detail modals |
| Select | `src/components/ui/select.tsx` | Dropdown filters, pickers |
| Label | `src/components/ui/label.tsx` | Form field labels |
| Separator | `src/components/ui/separator.tsx` | Visual dividers |

Import pattern:
```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
```

### Typography scale

| Role | Size | Weight | Tailwind | Font |
|------|------|--------|----------|------|
| Meta | 12px | 400 | `text-xs` | Inter |
| Body | 16px | 400 | `text-base` | Inter |
| Heading | 20px | 600 | `text-xl font-semibold` | Roboto |
| Display | 28px | 600 | `text-3xl font-semibold` | Roboto |

### 60/30/10 color split

| Role | Token | Usage |
|------|-------|-------|
| 60% Dominant | `bg-background` | Page canvas |
| 30% Secondary | `bg-card` | Cards, tables, sidebars (separated via `shadow` and `border`, not color) |
| 10% Accent | `bg-primary` | Primary CTAs, active nav, focus rings |

### Status badge colors

| Status | Class |
|--------|-------|
| Healthy / Active / Completed | `bg-green-100 text-green-800` |
| Low / Pending | `bg-amber-100 text-amber-800` |
| Out of stock / Inactive | `bg-red-100 text-red-800` |

**Transition note:** Existing pages from Phases 1-2 use raw Tailwind classes (`bg-blue-600`, `text-gray-900`). New pages use shadcn tokens (`bg-primary`, `text-foreground`). Both coexist — no migration needed.

## Layout shells

Two distinct layouts serve different user roles. Both share the same design system.

### Admin layout (`src/app/admin/layout.tsx`)

Top navigation bar with horizontal links. Manager-only (role-gated).

```
┌──────────────────────────────────────────────────────┐
│  Retail POS   Products   Inventory   Transactions    │  ← h-16, bg-card, shadow
│                                     [Role] [Logout]  │
├──────────────────────────────────────────────────────┤
│  max-w-6xl mx-auto p-8                               │
│  {children}                                           │
└──────────────────────────────────────────────────────┘
```

Admin routes: `/admin`, `/admin/products`, `/admin/inventory`, `/admin/transactions`

### Cashier (POS) layout (`src/app/pos/layout.tsx`)

Split-panel terminal — product catalog on the left, cart on the right. Standard POS pattern.

```
┌────────────────────────────────────────────────────────────────┐
│  POS Terminal                            [Cashier] [Logout]     │  ← h-14
├─────────────────────────────────┬──────────────────────────────┤
│  [Search products...]           │  Cart                         │
│  ┌─────┐ ┌─────┐ ┌─────┐      │  Item    Qty   Price   Total  │
│  │ P1  │ │ P2  │ │ P3  │      │  Widget   2   $12.99  $25.98  │
│  └─────┘ └─────┘ └─────┘      │  Gadget   1    $5.49   $5.49  │
│  ...                           │  ─────────────────────────── │
│                                 │  Subtotal          $31.47    │
│                                 │  Tax (8%)           $2.52    │
│                                 │  Total             $33.99    │
│                                 │  ─────────────────────────── │
│                                 │  [ Pay ]     [ Clear Cart ]   │
├─────────────────────────────────┴──────────────────────────────┤
│  Previous   Page 1 of 10   Next                                │
└────────────────────────────────────────────────────────────────┘
```

POS routes: `/pos` (terminal)

## Page templates

### List page template
Used by: Products, Inventory, Transactions

- Page title: Display tier (`text-3xl font-semibold`)
- Search input: full width, shadcn Input
- Table: shadcn Table in a `bg-card rounded-lg shadow` container
- Table header: `bg-muted text-xs uppercase text-muted-foreground`
- Row hover: `hover:bg-muted/50`
- Pagination: `flex justify-between items-center mt-4`
- Empty state: centered, `text-muted-foreground`

### Form page template
Used by: New Product, Edit Product

- Page title: Display tier
- Form card: shadcn Card with `p-6`
- Labels: shadcn Label, `text-xs text-muted-foreground`
- Inputs: shadcn Input, full width
- Button row: `flex justify-end gap-3 mt-6`
- Cancel: Button variant `outline`; Submit: Button variant `default`

### Dashboard tile template
Used by: Admin dashboard

- Container: `bg-card rounded-lg shadow p-6`
- Title: `text-xs uppercase text-muted-foreground`
- Value: `text-3xl font-semibold text-foreground`
- Subtitle: `text-sm text-muted-foreground`

## Not yet implemented

- ✅ Authentication & user management (Phase 1)
- ✅ Product CRUD interface (Phase 2)
- ✅ UI foundation — shared components, layouts, templates
- ❌ Inventory management
- ❌ POS checkout interface
- ❌ Transaction history & reporting
- ❌ Receipt generation

## Files to explore

- [`prisma/schema.prisma`](../../prisma/schema.prisma) — Database schema
- [`src/lib/prisma.ts`](../../src/lib/prisma.ts) — Prisma client singleton
- [`src/app/generated/prisma/`](../../src/app/generated/prisma/) — Generated client types
- [`src/components/ui/`](../../src/components/ui/) — shadcn components
- [`src/app/admin/layout.tsx`](../../src/app/admin/layout.tsx) — Admin layout shell
- [`src/app/globals.css`](../../src/app/globals.css) — Design tokens (CSS variables)
- [`.planning/UI-SPEC.md`](../../.planning/UI-SPEC.md) — Full UI design contract

---

*Last updated: 2026-07-07 after UI foundation setup*
