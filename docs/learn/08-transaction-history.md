# Chapter 8 — Transaction History

> Managers need to see what happened at the register — every sale, every payment method, every line item. This chapter builds that visibility.

## The problem

After a cashier completes a checkout, the order exists in the database but there's no way for managers to see it. No transaction list, no filtering, no detail view. For a real store, this means:

- Can't verify end-of-day sales
- Can't reconcile cash drawer vs. card transactions
- Can't investigate a customer complaint about a past purchase
- Can't see what products were sold together

The API layer already supports listing orders with pagination and filters (built in Phase 5), but there's no UI to consume it.

## The rationale

| Decision | Why |
|---|---|
| **Reuse existing GET /api/orders endpoint** | The endpoint already supports pagination, date range filtering, and payment method filtering. No need to create a new API — just build the UI to consume it. |
| **New GET /api/orders/:id endpoint** | The list endpoint returns orders with items, but a dedicated detail endpoint keeps concerns separate and allows future expansion (e.g., adding refund info, customer details). |
| **Date range filter with HTML date inputs** | Native `<input type="date">` is simple, works everywhere, and doesn't require a date picker library. Managers can type dates or use the browser's date picker. |
| **Payment method filter with Select dropdown** | Matches the POS terminal's payment methods: Cash, Card, QR Pay. Consistent UX across the app. |
| **Summary stat cards above the table** | Gives managers instant visibility into total transactions, revenue, and today's activity without scrolling through the list. |
| **DataTable with onRowClick for navigation** | Clicking a row navigates to the detail page. Standard pattern — users expect it from table UIs. |

## What was built

**New files:**
- [`src/app/admin/transactions/page.tsx`](../../src/app/admin/transactions/page.tsx) — Transaction list page with date range filter, payment method filter, summary stats, and paginated DataTable.
- [`src/app/admin/transactions/[id]/page.tsx`](../../src/app/admin/transactions/[id]/page.tsx) — Transaction detail page showing order summary cards, line items table with product details, and totals breakdown.
- [`src/app/api/orders/[id]/route.ts`](../../src/app/api/orders/[id]/route.ts) — GET endpoint returning a single order with items and product details.

**Modified files:**
- [`src/components/layout/nav-links.tsx`](../../src/components/layout/nav-links.tsx) — Added "Transactions" nav item with Receipt icon to manager sidebar.

## How it works

### Transaction list page

The list page follows the admin page pattern established in earlier phases:

```
PageContainer
├── PageHeader (title + description)
├── Filter Bar (date range + payment method + clear button)
├── Summary Stats (total transactions, revenue, today's count)
├── DataTable (orders with columns)
└── DataTablePagination (page navigation)
```

**Data flow:**
1. Page mounts → `fetchOrders(1)` called
2. Query params built from filter state: `page`, `pageSize`, `startDate`, `endDate`, `paymentMethod`
3. Fetches from `GET /api/orders?${params}`
4. Response contains `orders[]` and `pagination` object
5. Orders rendered in DataTable, pagination controls below

**Filter behavior:**
- Changing any filter triggers `fetchOrders(1)` (reset to page 1)
- Empty filter values are omitted from the query params
- "Clear Filters" resets all filter state and refetches

### Transaction detail page

The detail page uses Next.js dynamic routes (`[id]`) to load a single order:

```
PageContainer
├── PageHeader (order number + date + back button)
├── Summary Cards (status, payment method, total, items count)
├── Order Items Table (product, SKU, quantity, unit price, line total)
└── Totals Summary (subtotal, tax, total)
```

**Data flow:**
1. Page mounts → `useParams()` extracts `id` from URL
2. Fetches from `GET /api/orders/${id}`
3. Response includes order with `items[]` and nested `product` details
4. Renders summary cards and line items table

### API endpoint

The new `GET /api/orders/:id` endpoint:

```ts
const order = await prisma.order.findUnique({
  where: { id: orderId },
  include: {
    items: {
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    },
  },
});
```

- Uses `findUnique` for single-order lookup
- Includes items with product details (name, sku) for display
- Returns 404 if order not found
- Returns 400 if ID is not a valid number

### Payment method alignment

The POS terminal stores payment methods as: `Cash`, `Card`, `QR`. The transaction history filter and display must match these values exactly:

| POS Terminal | Transactions Filter | Display Label |
|--------------|---------------------|---------------|
| Cash | `Cash` | Cash |
| Card | `Card` | Card |
| QR | `QR` | QR Pay |

The filter dropdown sends the exact value (`Cash`, `Card`, `QR`) to the API, which filters using exact string matching.

## Trade-offs & gotchas

| Trade-off | What we gave up | Why it's okay |
|---|---|---|
| **No real-time updates** | Transaction list doesn't auto-refresh when new orders are placed | Managers typically check transactions periodically, not continuously. A manual refresh or page reload suffices for this scale. |
| **No export functionality** | Can't export transactions to CSV/Excel | Out of scope for MVP. Can be added later if needed for accounting. |
| **No refund/void actions** | Can only view transactions, not modify them | Refund flows are a separate feature (Phase 8+). The detail page provides the foundation for future refund UI. |
| **Date filter uses string comparison** | `createdAt` is compared as ISO string, not native date | Works correctly because PostgreSQL stores timestamps in ISO format and string comparison preserves chronological order. |

**Gotcha:** The payment method values are case-sensitive. `cash` ≠ `Cash`. The POS terminal sends `Cash`, so the filter must send `Cash` — not lowercase.

## Explore it yourself

**Files to open:**
- [`src/app/admin/transactions/page.tsx`](../../src/app/admin/transactions/page.tsx) — List page with filters
- [`src/app/admin/transactions/[id]/page.tsx`](../../src/app/admin/transactions/[id]/page.tsx) — Detail page
- [`src/app/api/orders/[id]/route.ts`](../../src/app/api/orders/[id]/route.ts) — API endpoint
- [`src/components/layout/nav-links.tsx`](../../src/components/layout/nav-links.tsx) — Nav item

**Try it:**
1. Log in as manager (manager@example.com / password123)
2. Click "Transactions" in the sidebar
3. See the transaction list with orders from previous checkouts
4. Filter by date range — orders outside the range disappear
5. Filter by payment method — only matching orders show
6. Click a row — navigate to detail page with line items
7. Click "Back to Transactions" — return to list

**API testing:**
```bash
# List all orders
curl http://localhost:3000/api/orders

# Filter by date range
curl "http://localhost:3000/api/orders?startDate=2026-07-08&endDate=2026-07-08"

# Filter by payment method
curl "http://localhost:3000/api/orders?paymentMethod=Cash"

# Get single order
curl http://localhost:3000/api/orders/1
```

---
*Learn file created: 2026-07-08 after transaction history implementation*
