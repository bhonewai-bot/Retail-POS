# Phase 2 — Product Management

> Managers can create, edit, list, and search products. A REST API backs a Tailwind admin UI with pagination, search, and category assignment.

## The problem

The POS system needs a way for managers to maintain the product catalog — adding new items, updating prices, deactivating discontinued products, and finding products quickly across ~200 items. Without this, there's nothing to put in a cart at checkout.

## The rationale

| Decision | Why |
|---|---|
| **REST API routes (not Server Actions)** | Products are a full CRUD resource consumed by both the admin UI and (later) the POS terminal. REST routes give a clean contract that any client can call — no Server Action dependency on React. |
| **Soft delete (`isActive: false`)** | Products appear in historical orders. Hard-deleting would orphan `OrderItem` references. Toggling `isActive` hides them from active listings while preserving referential integrity. |
| **SKU uniqueness check on create/update** | SKUs are the natural key for a retail system. The API catches duplicate SKUs at write time (409 Conflict) rather than letting bad data through. |
| **Decimal serialized to string** | Prisma `Decimal` fields (`price`, `cost`) are not natively JSON-serializable. Converting to strings avoids floating-point surprises and keeps the API contract explicit. |
| **`await params` in route handlers** | Next.js 15+ changed dynamic route `params` to a `Promise`. Every `[id]` handler must `await params` before accessing `id` — a common migration gotcha. |
| **Debounced search (300ms)** | Typing "apple" fires 5 API calls without debounce. A 300ms delay via `useRef` timer keeps the UI responsive while reducing server load. |

## What was built

**API layer** ([`src/app/api/products/`](../../src/app/api/products/)):
- [`route.ts`](../../src/app/api/products/route.ts) — `GET` (paginated list with category) + `POST` (create with validation)
- [`[id]/route.ts`](../../src/app/api/products/[id]/route.ts) — `GET` (single), `PUT` (update), `DELETE` (soft-delete)
- [`search/route.ts`](../../src/app/api/products/search/route.ts) — `GET` search by name or SKU (case-insensitive, max 50 results)
- [`src/app/api/categories/route.ts`](../../src/app/api/categories/route.ts) — `GET` all categories for form dropdowns

**Seed script** ([`scripts/seed-categories.ts`](../../scripts/seed-categories.ts)):
- Creates 6 demo categories: Produce, Dairy, Bakery, Beverages, Snacks, Household

**Admin UI** ([`src/app/admin/products/`](../../src/app/admin/products/)):
- [`page.tsx`](../../src/app/admin/products/page.tsx) — product list table with search, pagination, stock display, edit/deactivate actions
- [`new/page.tsx`](../../src/app/admin/products/new/page.tsx) — new product form with all fields and category dropdown
- [`[id]/edit/page.tsx`](../../src/app/admin/products/[id]/edit/page.tsx) — edit form pre-filled with existing data

**Admin layout** ([`src/app/admin/layout.tsx`](../../src/app/admin/layout.tsx)):
- Wraps all admin pages — auth guard, nav bar, logout button

## How it works

### Product API — the CRUD contract

Every product endpoint imports the singleton Prisma client from `@/lib/prisma` and follows the same pattern:

```ts
// GET /api/products?page=1&pageSize=10
const { page = 1, pageSize = 10 } = searchParams;
const skip = (Number(page) - 1) * Number(pageSize);

const [products, total] = await Promise.all([
  prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
    skip, take: Number(pageSize),
    orderBy: { name: 'asc' },
  }),
  prisma.product.count({ where: { isActive: true } }),
]);

// Decimal fields → strings
const serialized = products.map(p => ({
  ...p,
  price: p.price.toString(),
  cost: p.cost.toString(),
}));
```

**Concepts:**
- **Offset pagination** with `skip`/`take` — simple, sufficient for ~200 products. Cursor-based would be overkill.
- **`Promise.all` for list + count** — runs both queries concurrently to avoid serial latency.
- **Decimal serialization** — Prisma `Decimal` comes back as a `Prisma.Decimal` object. Calling `.toString()` gives `"12.99"` — clean for JSON, but the client must parse it back if doing math.

### Soft delete pattern

```ts
// DELETE /api/products/1
await prisma.product.update({
  where: { id: Number(params.id) },
  data: { isActive: false },
});
```

The product stays in the database (referential integrity with `OrderItem`), but all active queries filter on `isActive: true`. This is the standard pattern for retail systems — you never want to lose historical pricing data.

### Search with debounce

The admin UI's search input uses a 300ms debounce:

```ts
const timerRef = useRef<NodeJS.Timeout>();

const handleSearch = (value: string) => {
  clearTimeout(timerRef.current);
  timerRef.current = setTimeout(() => {
    setSearch(value);
  }, 300);
};
```

The `search` state triggers a `useEffect` that calls `GET /api/products/search?q=...`. The API uses Prisma's `contains` with `mode: 'insensitive'` for case-insensitive substring matching.

### Admin layout — auth guard at the boundary

```ts
// src/app/admin/layout.tsx
export default async function AdminLayout({ children }) {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session) redirect('/login');
  // render nav + children
}
```

Every admin page inherits this layout — no individual page needs its own auth check (though defense-in-depth is still applied in the products page as a safety net).

## Trade-offs & gotchas

- **Decimal as string is lossy for client math.** If the frontend needs to compute totals, it must `parseFloat()` the string. This is fine for display but adds friction for cart calculations (Phase 5).
- **Offset pagination breaks with concurrent mutations.** If a product is added/deleted between page 1 and page 2 requests, items can shift or duplicate. Acceptable at ~200 items; would need cursor pagination at scale.
- **No optimistic updates on the UI.** The deactivate button sends DELETE then re-fetches. At this scale it's instant, but it won't feel instant on a slow connection.
- **Category dropdown fetches on mount.** Categories are static-ish (seeded once). A `React.cache` or SWR stale-while-revalidate pattern would avoid the extra request, but the current approach is simpler and correct.

## Explore it yourself

```bash
npm run db:seed:categories   # seed the 6 demo categories
npm run dev
# log in as admin@demo.com / demo1234, then:
#   /admin/products      → product list with search
#   /admin/products/new  → create a product
#   /admin/products/1/edit → edit an existing product
```

Open:
1. [`src/app/api/products/route.ts`](../../src/app/api/products/route.ts) — the paginated list and create handler.
2. [`src/app/admin/products/page.tsx`](../../src/app/admin/products/page.tsx) — the product list with search and deactivate.
3. [`scripts/seed-categories.ts`](../../scripts/seed-categories.ts) — category seeding pattern.

→ Next: [Phase 3 — Inventory Tracking](04-inventory-tracking.md)
