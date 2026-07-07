# Phase 5 — Checkout Flow

> Cashiers need to complete transactions — adding products to cart, calculating totals, processing simulated payment, and creating order records with atomic stock decrement.

## The problem

The POS terminal displays products and manages a cart, but there's no way to finalize a sale. When a cashier rings up items and the customer pays, the transaction exists only in the browser's memory. The cart clears on refresh, stock levels don't update, and no record of the sale is persisted. For a POS system, this is the core workflow — without it, the system is just a product catalog.

## The rationale

| Decision | Why |
|---|---|
| **`prisma.$transaction` for atomic order creation** | Creating an order, its line items, and decrementing stock must happen together or not at all. A failure between writes could leave inconsistent state — order created but stock unchanged, or stock decremented but no order record. Interactive transaction with `createMany` and `update` ensures atomicity. |
| **Random order numbers (`ORD-YYYYMMDD-XXXX`)** | Sequential numbers require database sequences or counters, adding complexity. Random 4-digit suffix (1000-9999) gives 9000 combinations per day — sufficient for a demo with ~200 products and single-store operation. Format is human-readable and sortable by date. |
| **1500ms simulated payment delay** | Real payment processing takes time. The delay provides realistic feel without adding complexity. No need for configurable delay or instant feedback in a demo. |
| **Toast-only error handling** | When payment fails (insufficient stock, API error), showing a toast with the error message is sufficient. Cart stays intact so the cashier can retry or modify items. No error modal or retry button needed for demo complexity. |
| **Cart resets on page refresh** | In-memory cart via React state is simple and avoids stale stock data issues. localStorage or database persistence would add complexity and potential data inconsistency if stock levels change while cart is stored. |
| **Auto-dismiss success modal (3 seconds)** | Toast notifications can be missed in a busy POS environment. A modal with order number, total, and payment method is more visible. 3 seconds is fast enough for POS workflow but visible enough for confirmation. Cart clears when modal appears, not after dismissal. |

## What was built

**API layer:**
- [`src/app/api/orders/route.ts`](../../src/app/api/orders/route.ts) — `POST` creates order with line items and atomically decrements stock via `$transaction`; `GET` returns paginated order history with items and product info, filterable by `paymentMethod`, `startDate`, `endDate`.

**UI updates:**
- [`src/app/pos/page.tsx`](../../src/app/pos/page.tsx) — `PaymentDialog` now calls POST /api/orders on payment completion, shows auto-dismiss success modal (3 seconds) with order number/total/payment method, handles errors via toast.

**Cart store (unchanged):**
- [`src/components/pos/cart-store.tsx`](../../src/components/pos/cart-store.tsx) — `useCart()` hook provides `state.items`, `subtotal`, `tax`, `total`, `dispatch` — used by PaymentDialog to build order payload.

## How it works

### Atomic order creation via interactive `$transaction`

The POST endpoint uses Prisma's interactive transaction to guarantee all writes succeed or all fail:

```ts
const order = await prisma.$transaction(async (tx) => {
  // Create the order
  const newOrder = await tx.order.create({
    data: {
      orderNumber,
      subtotal,
      tax,
      total,
      paymentMethod: paymentMethod.trim(),
      status: 'completed',
    },
  });

  // Create order items
  await tx.orderItem.createMany({
    data: items.map((item) => ({
      orderId: newOrder.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
    })),
  });

  // Decrement stock for each product
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  // Return order with items
  return tx.order.findUnique({
    where: { id: newOrder.id },
    include: { items: true },
  });
});
```

**Key insight:** Interactive transactions (with a callback) are more flexible than array transactions. The callback receives a `tx` client that wraps all operations in a single database transaction. If any operation fails, everything rolls back. The `createMany` for order items is efficient — one INSERT for all items instead of N separate inserts.

### Stock validation before transaction

Before creating the order, the endpoint verifies all products exist and have sufficient stock:

```ts
const products = await prisma.product.findMany({
  where: { id: { in: productIds } },
});

const productMap = new Map(products.map((p) => [p.id, p]));

for (const item of items) {
  const product = productMap.get(item.productId);
  if (!product) {
    return Response.json({ error: 'Product not found' }, { status: 404 });
  }
  if (product.stock < item.quantity) {
    return Response.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });
  }
}
```

**Key insight:** Validation happens before the transaction starts. This avoids opening a transaction that's guaranteed to fail. The `Map` lookup is O(1) per item — efficient even with many products.

### Order number generation

```ts
const now = new Date();
const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
const randomNum = Math.floor(1000 + Math.random() * 9000);
const orderNumber = `ORD-${dateStr}-${randomNum}`;
```

**Key insight:** `Math.floor(1000 + Math.random() * 9000)` generates a number between 1000 and 9999. Combined with the date, this gives 9000 unique combinations per day. Collisions are possible but unlikely for a demo — and the `@unique` constraint on `orderNumber` would catch any duplicates.

### Success modal with auto-dismiss

```ts
const [success, setSuccess] = useState<{ orderNumber: string; total: number; paymentMethod: string } | null>(null);

useEffect(() => {
  if (success) {
    const timer = setTimeout(() => {
      setSuccess(null);
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }
}, [success, onComplete]);
```

**Key insight:** The `useEffect` dependency on `success` triggers the timer when the modal appears. The cleanup function prevents the timer from firing if the component unmounts. The modal uses `onOpenChange={() => {}}` to prevent closing via outside click — only the auto-dismiss timer closes it.

### Dynamic where clause for order filters

The GET endpoint builds filters conditionally, same pattern as other APIs:

```ts
const where: Record<string, unknown> = {};
if (paymentMethodParam) {
  where.paymentMethod = paymentMethodParam;
}
if (startDateParam) {
  where.createdAt = { ...(where.createdAt as object), gte: new Date(startDateParam) };
}
if (endDateParam) {
  where.createdAt = { ...(where.createdAt as object), lte: new Date(endDateParam) };
}
```

**Key insight:** The `createdAt` filter merges `gte` and `lte` operators using spread. If both start and end dates are provided, the query filters orders within that range. If only one is provided, it filters orders after the start date or before the end date.

## Trade-offs & gotchas

### What we gave up

| Trade-off | Cost | Mitigation |
|---|---|---|
| **No real payment processing** | Can't demonstrate actual Stripe/card integration | Simulated delay provides realistic feel; Stripe integration deferred to Phase 2 |
| **No cart persistence** | Cart resets on page refresh — cashier loses items if browser crashes | Acceptable for demo; real POS systems would use database-backed carts |
| **Random order numbers** | Possible (unlikely) collisions on same day | `@unique` constraint catches duplicates; 9000 combinations/day sufficient for demo scale |
| **Toast-only error handling** | Errors might be missed in busy environment | Acceptable for demo; real POS would need more prominent error display |

### Sharp edges

- **Stock race condition**: Two cashiers selling the same last item simultaneously could both succeed. This is addressed in Phase 6 (Atomic Transactions) with pessimistic locking.
- **No customer association**: Orders don't track which customer made the purchase. The `customerId` field exists in the schema but is nullable — can be added later.
- **Decimal serialization**: Prisma `Decimal` types need `.toString()` for JSON serialization. The API returns raw numbers, not strings — this works because the client-side `total.toFixed(2)` handles display formatting.

## Explore it yourself

**Files to open:**
1. [`src/app/api/orders/route.ts`](../../src/app/api/orders/route.ts) — Orders API endpoint
2. [`src/app/pos/page.tsx`](../../src/app/pos/page.tsx) — PaymentDialog with success modal
3. [`src/components/pos/cart-store.tsx`](../../src/components/pos/cart-store.tsx) — Cart state management
4. [`prisma/schema.prisma`](../../prisma/schema.prisma) — Order and OrderItem models

**Commands to run:**
```bash
# Start dev server
npm run dev

# Test orders API (after creating an order via POS terminal)
curl http://localhost:3000/api/orders

# Check TypeScript compilation
npx tsc --noEmit
```

**Try it:**
1. Log in as cashier (`cashier@demo.com` / `demo1234`)
2. Add products to cart
3. Click "Pay" and select a payment method
4. Watch the success modal appear with order number
5. Check the database — order record exists with line items, stock decremented

---

*Phase: 05-Checkout Flow*
*Learn file created: 2026-07-07*
