# Phase 3 — Inventory Tracking

> Managers need a dedicated view to monitor stock levels across all products — quickly identify low-stock items, search by name or SKU, and filter to only products that need attention.

## The problem

The product management page shows stock as a column, but it's buried among edit actions, pricing, and category data. Managers who just want to answer "what's running low?" have to scan a full CRUD table, toggle between pages, and mentally filter. There's no quick way to see at a glance which products are out of stock versus healthy, and no way to filter to just the ones that need restocking.

## The rationale

| Decision | Why |
|---|---|
| **Dedicated API endpoint (`/api/inventory`)** | The products API returns full CRUD data with categories, pricing, and metadata. Inventory monitoring only needs stock levels, names, and SKUs. A focused endpoint keeps the query simple and the response lean. |
| **Server-side filtering (lowStock, search)** | Filtering on the client would require fetching all ~200 products every time. Server-side filtering with Prisma's `where` clause pushes the work to the database, which is faster and scales better. |
| **Fixed low-stock threshold (`stock <= 10`)** | The UI-SPEC defines a single "low stock" bucket. A configurable threshold would be more flexible but adds complexity for no real benefit in a demo POS. The number 10 is baked into both the API query and the status function. |
| **Read-only page (no edit/deactivate)** | The inventory page is a monitoring dashboard, not a management tool. Adding edit actions would duplicate the products page. Keeping it read-only makes the purpose clear and the code simpler. |
| **Color-coded stock values** | Red (0), amber (1–10), default (>10) gives instant visual scanning. Managers can spot problems without reading every number — the color tells the story before the label does. |
| **`stock: 'asc'` default sort** | Lowest stock first means the most urgent items appear at the top of the list. This is the natural sort for a monitoring view — you want to see what's running out, not what's well-stocked. |

## What was built

**API layer:**
- [`src/app/api/inventory/route.ts`](../../src/app/api/inventory/route.ts) — `GET` with dynamic `where` clause: `isActive: true`, optional `stock: { lte: 10 }` for low-stock filter, optional `OR` on name/SKU for search. Returns paginated products sorted by stock ascending.

**Admin UI:**
- [`src/app/admin/inventory/page.tsx`](../../src/app/admin/inventory/page.tsx) — client component with auth guard (manager role), 4-column DataTable (Product, Category, Stock, Status), search input with 300ms debounce, low-stock filter toggle, pagination.

**Navigation:**
- [`src/components/layout/nav-links.tsx`](../../src/components/layout/nav-links.tsx) — added Inventory entry with `BarChart3` icon to `managerNavItems` array (Dashboard → Products → Inventory).

## How it works

### Inventory API — dynamic where clause

The endpoint builds a Prisma `where` object conditionally:

```ts
const where: Record<string, unknown> = { isActive: true };

if (lowStock) {
  where.stock = { lte: 10 };
}

if (search.trim()) {
  where.OR = [
    { name: { contains: search.trim(), mode: 'insensitive' } },
    { sku: { contains: search.trim(), mode: 'insensitive' } },
  ];
}

const [products, total] = await Promise.all([
  prisma.product.findMany({ where, include: { category: true }, ... }),
  prisma.product.count({ where }),
]);
```

**Concepts:**
- **Dynamic `where` construction** — start with the base filter (`isActive: true`), then conditionally add `stock` and `OR` filters. Each filter is independent and composes cleanly.
- **`mode: 'insensitive'`** — Prisma's PostgreSQL insensitive search. Works because PostgreSQL's default collation is case-insensitive. Would fail on SQLite.
- **`Promise.all` for list + count** — same pattern as the products route. Both queries share the same `where` clause, so the count always matches the list.

### Stock status logic

A pure function maps stock count to a visual variant:

```ts
function getStockStatus(product: InventoryProduct) {
  if (product.stock === 0) return { variant: 'out-of-stock', label: 'Out of Stock' };
  if (product.stock >= 1 && product.stock <= 10) return { variant: 'low-stock', label: 'Low Stock' };
  return { variant: 'active', label: 'Healthy' };
}
```

The `StatusBadge` component already supports these three variants — the inventory page just feeds it the right one. No new badge variants needed.

### Color-coded stock column

The stock cell applies Tailwind classes conditionally:

```tsx
<div className={cn(
  'text-right text-sm font-medium tabular-nums',
  stock === 0 && 'text-red-600',
  stock > 0 && stock <= 10 && 'text-amber-600'
)}>
  {stock}
</div>
```

**`tabular-nums`** ensures numbers align vertically in the column — critical for scanning stock levels at a glance. Without it, proportional digits shift left/right depending on the digits present.

### Low-stock filter toggle

The toggle button swaps between `variant="default"` (filled primary) and `variant="outline"` based on filter state:

```tsx
<Button
  variant={lowStockFilter ? 'default' : 'outline'}
  size="sm"
  onClick={handleLowStockToggle}
>
  Show Low Stock Only
</Button>
```

When active, the button visually "pops" to indicate the filter is on. The `useEffect` on `lowStockFilter` triggers a refetch with `page=1` to reset pagination.

## Trade-offs & gotchas

- **Fixed threshold (`<= 10`) is not configurable.** A real system would store `lowStockThreshold` per product (the field exists in the schema). For this demo, a fixed threshold keeps the UI simple and avoids per-product configuration complexity.
- **No client-side caching.** Every filter change or page navigation hits the API. At ~200 products this is instant, but a real system would benefit from SWR or React Query for optimistic updates and cache invalidation.
- **Search resets to page 1.** If you're on page 3 and type a search, you jump back to page 1. This is correct behavior (the search results might not have 3 pages), but it can feel disorienting if you're browsing and accidentally type something.
- **`useCallback` dependency on `searchQuery` and `lowStockFilter`.** The `fetchInventory` function is recreated whenever filters change, which triggers the auth-guard `useEffect` to re-run. This works but causes a brief flash on filter changes. A ref-based approach would avoid the re-render cascade.
- **No real-time stock updates.** Stock levels are fetched once on mount and on filter changes. If another user adjusts stock, the page won't reflect it until refresh. Acceptable for a demo; a real system would use polling or WebSockets.

## Explore it yourself

```bash
npm run dev
# log in as admin@demo.com / demo1234, then:
#   /admin/inventory    → stock levels table
#   /api/inventory      → raw JSON response
#   /api/inventory?lowStock=true  → only low-stock products
#   /api/inventory?search=apple   → search by name/SKU
```

Open:
1. [`src/app/api/inventory/route.ts`](../../src/app/api/inventory/route.ts) — the dynamic where clause and pagination.
2. [`src/app/admin/inventory/page.tsx`](../../src/app/admin/inventory/page.tsx) — the monitoring page with stock status logic.
3. [`src/components/layout/nav-links.tsx`](../../src/components/layout/nav-links.tsx) — the updated nav array.

→ Next: [Phase 4 — Inventory Adjustments](05-inventory-adjustments.md)
