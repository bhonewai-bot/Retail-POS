# Phase 4 — Inventory Adjustments

> Managers need to adjust stock quantities — receive shipments, record damage, correct counts — directly from the inventory screen, with a clear audit trail of all changes.

## The problem

The inventory page shows stock levels, but there's no way to change them. When a shipment arrives, a product is damaged, or a physical count reveals a discrepancy, the manager has no in-app way to record the change. Stock numbers can only be updated by directly editing the database, which means no history, no accountability, and no audit trail.

## The rationale

| Decision | Why |
|---|---|
| **Dedicated `InventoryAdjustment` model** | Adjustments are a distinct domain concept — who changed what, when, and why. Burying this in the Product model would lose the audit trail. A separate model with its own indexes lets you query adjustment history efficiently without scanning the products table. |
| **`prisma.$transaction` for atomic stock updates** | Creating an adjustment record and updating product stock must happen together or not at all. Without a transaction, a failure between the two writes could leave the database in an inconsistent state — an adjustment recorded but stock unchanged, or stock updated but no record of who did it. |
| **Hardcoded manager `userId`** | The demo POS doesn't have full auth integration on API routes (no session token in fetch requests). The admin UI is protected by middleware, so the API is only called from authenticated contexts. Using the first manager user as a fallback is acceptable for a demo. |
| **`onDelete: Restrict` on product/user relations** | You should never delete a product or user that has adjustment history — that would destroy the audit trail. `Restrict` prevents accidental cascade deletes while still allowing the adjustment records to exist independently. |
| **Native `<select>` over shadcn Select** | The adjustment type dropdown has 5 fixed options. A native HTML select is simpler, has no base-ui dependency issues inside a dialog context, and the visual difference is negligible for a form element. |
| **Button-based tabs over full Tabs component** | Switching between "Stock Levels" and "Adjustment History" is a simple binary toggle. A full Tabs component with base-ui primitives adds complexity for no benefit — two buttons with conditional rendering achieve the same result with less code. |

## What was built

**Schema:**
- [`prisma/schema.prisma`](../../prisma/schema.prisma) — `InventoryAdjustment` model with `type`, `quantity`, `reason`, `productId`, `userId`, `createdAt` fields, indexes on all query-heavy columns, and `onDelete: Restrict` on both relations.

**API layer:**
- [`src/app/api/inventory/adjustments/route.ts`](../../src/app/api/inventory/adjustments/route.ts) — `POST` creates adjustment + updates stock atomically via `$transaction`; `GET` returns paginated history with product/user info, filterable by `productId` and `type`.
- [`src/app/api/inventory/adjustments/[id]/route.ts`](../../src/app/api/inventory/adjustments/[id]/route.ts) — `GET` single adjustment detail with full product (name, sku, stock) and user (name, email) relations.

**UI components:**
- [`src/components/inventory/adjustment-dialog.tsx`](../../src/components/inventory/adjustment-dialog.tsx) — Modal dialog with type selector (5 options), quantity input, reason textarea, client-side validation, and POST to the adjustments API.
- [`src/components/inventory/adjustment-history.tsx`](../../src/components/inventory/adjustment-history.tsx) — Paginated table showing date, product (name + SKU), type (human-readable label), quantity (+/- with color), adjusted by, and reason.

**Updated page:**
- [`src/app/admin/inventory/page.tsx`](../../src/app/admin/inventory/page.tsx) — Added "Stock Levels" / "Adjustment History" tab navigation, "Adjust" button per row that opens the dialog, and stock table refresh after successful adjustment.

## How it works

### Atomic stock adjustment via `$transaction`

The POST endpoint uses Prisma's interactive transaction to guarantee both writes succeed or both fail:

```ts
const [adjustment] = await prisma.$transaction([
  prisma.inventoryAdjustment.create({
    data: {
      type,
      quantity,
      reason: reason ? String(reason).trim() : null,
      productId,
      userId: managerUser.id,
    },
  }),
  prisma.product.update({
    where: { id: productId },
    data: { stock: newStock },
  }),
]);
```

**Key insight:** `$transaction` takes an array of Prisma operations and runs them in a single database transaction. If either operation fails (constraint violation, connection error, etc.), both are rolled back. This is the simplest way to ensure atomicity in Prisma — no raw SQL, no explicit `BEGIN`/`COMMIT`.

The `newStock` is calculated before the transaction: `product.stock + quantity`. If the result would be negative, the endpoint returns 400 before even starting the transaction — no point in opening a transaction that's guaranteed to fail.

### Adjustment type validation

The valid types are defined as a `const` tuple:

```ts
const VALID_TYPES = ['stock-receipt', 'damage', 'count-adjustment', 'return', 'other'] as const;
```

The `as const` assertion makes TypeScript treat this as a readonly tuple of literal types, so `VALID_TYPES.includes(type)` narrows `type` to the union type. This avoids a separate enum or type definition — the runtime array and the TypeScript type are the same thing.

### Dynamic where clause for filters

The GET endpoint builds filters conditionally, same pattern as the inventory tracking API:

```ts
const where: Record<string, unknown> = {};
if (productIdParam) {
  const pid = parseInt(productIdParam, 10);
  if (Number.isInteger(pid) && pid > 0) {
    where.productId = pid;
  }
}
if (typeParam && VALID_TYPES.includes(typeParam as typeof VALID_TYPES[number])) {
  where.type = typeParam;
}
```

Starting with an empty object and adding filters only when valid input is provided means the endpoint returns all adjustments when no filters are specified, and narrows correctly when filters are present.

### Form dialog with controlled state

The `AdjustmentDialog` manages its own form state and resets on close:

```ts
function resetForm() {
  setType('stock-receipt');
  setQuantity('');
  setReason('');
  setError('');
}

function handleClose() {
  resetForm();
  onOpenChange(false);
}
```

**Why reset on close?** If a user opens the dialog, partially fills it, closes it, and opens it again for a different product, they should see a clean form — not the stale state from the previous attempt. The `resetForm()` call ensures this.

### Conditional quantity coloring in history

The history table shows adjustments with colored +/- prefixes:

```tsx
<span className={adj.quantity >= 0 ? 'text-emerald-600' : 'text-red-600'}>
  {adj.quantity >= 0 ? '+' : ''}{adj.quantity}
</span>
```

Positive quantities (stock increases) show green with a `+` prefix. Negative quantities (stock decreases) show red without a prefix (the minus sign is already part of the number). This makes it instantly clear whether an adjustment added or removed stock.

### Tab switching with conditional rendering

The inventory page uses simple state-driven rendering instead of a full tab component:

```tsx
const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');

// ...
{activeTab === 'stock' && (
  <>
    {/* Toolbar, DataTable, Pagination */}
  </>
)}

{activeTab === 'history' && (
  <AdjustmentHistory />
)}
```

**Why not a Tabs component?** There are exactly two tabs with no nested content, no accessibility requirements beyond basic keyboard navigation, and no complex state management. Two buttons with conditional rendering is the simplest solution. A Tabs component would add base-ui imports, ARIA attribute management, and panel rendering logic — all unnecessary for a binary toggle.

## Trade-offs & gotchas

- **No optimistic UI.** The dialog shows "Submitting..." while waiting for the API response. A real system might optimistically update the stock table before the response arrives, then reconcile on error. For a demo, the simpler loading state is sufficient.
- **Hardcoded manager userId.** In production, the API would extract the user ID from the session token (JWT or cookie). The current approach works because the admin UI is protected, but it means every adjustment is attributed to the same user in the database.
- **No real-time history updates.** If two managers adjust the same product simultaneously, each would see their own adjustment but not the other's until they refresh. Acceptable for a single-store demo.
- **`onDelete: Restrict` prevents product deletion.** If you try to delete a product that has adjustment history, Prisma will throw an error. This is intentional — you shouldn't delete data that has an audit trail. In production, you'd soft-delete (set `isActive: false`) instead.
- **No batch adjustments.** Each adjustment is a single product. A real system might support adjusting multiple products in one operation (e.g., receiving a shipment with 10 items). The current model and API would need restructuring to support this.
- **`prisma db push` was needed.** The migration history was out of sync with the database (tables created via `db push` in earlier phases weren't tracked). Running `prisma db push` again synced the schema. In production, you'd use `prisma migrate dev` to create proper migration files.

## Explore it yourself

```bash
npm run dev
# log in as admin@demo.com / demo1234, then:
#   /admin/inventory           → stock levels tab
#   click "Adjust" on any row  → opens adjustment dialog
#   submit an adjustment       → stock updates, switch to history tab to see it
#   /api/inventory/adjustments → raw JSON response
#   /api/inventory/adjustments?type=damage  → filter by type
```

Open:
1. [`prisma/schema.prisma`](../../prisma/schema.prisma) — the InventoryAdjustment model with relations and indexes.
2. [`src/app/api/inventory/adjustments/route.ts`](../../src/app/api/inventory/adjustments/route.ts) — the atomic `$transaction` and dynamic filter building.
3. [`src/components/inventory/adjustment-dialog.tsx`](../../src/components/inventory/adjustment-dialog.tsx) — the form dialog with validation and API integration.
4. [`src/components/inventory/adjustment-history.tsx`](../../src/components/inventory/adjustment-history.tsx) — the paginated history table with conditional coloring.
5. [`src/app/admin/inventory/page.tsx`](../../src/app/admin/inventory/page.tsx) — the updated page with tab navigation and Adjust button.

→ Next: [Phase 5 — Checkout Flow](06-checkout-flow.md)
