# Chapter 7 — Atomic Transactions

> Two cashiers selling the same last item at the same time — both succeed. Stock goes negative. This chapter fixes that.

## The problem

The checkout flow and inventory adjustments both validate stock *outside* the transaction, then decrement it *inside*. Between those two moments, another request can slip in and change the same stock. This is a classic TOCTOU (time-of-check-to-time-of-use) race condition.

**Concrete scenario:** Product A has 1 unit in stock. Two cashiers click "Pay" simultaneously. Both requests read `stock = 1`, both pass the check, both decrement. Final stock: `-1`. The system oversold a product that didn't exist.

The same vulnerability exists in inventory adjustments — a manager removing stock could race with a checkout, or two adjustments could race against each other.

## The rationale

| Decision | Why |
|---|---|
| **Pessimistic locking (`SELECT ... FOR UPDATE`)** | Locks the row the moment we read it. The second concurrent request blocks at the `FOR UPDATE` step until the first commits. Simple, well-understood, and PostgreSQL supports it natively. No application-level locks or retry loops needed. |
| **Lock inside `prisma.$transaction`** | The lock must be acquired inside the interactive transaction so it's released on commit or rollback. Locking outside the transaction would leave the lock dangling or release it before the transaction starts. |
| **Move stock check inside transaction** | Before this fix, stock was checked with a plain `findMany` outside the transaction. Now the check reads from the locked row — the same row that will be decremented. The check and the write see identical data. |
| **`Prisma.join` for raw queries** | `FOR UPDATE` requires raw SQL. `Prisma.join` safely interpolates the product ID array into the `WHERE id IN (...)` clause, preventing SQL injection while supporting multiple rows. |
| **Same pattern for both endpoints** | Orders and inventory adjustments both have the same race condition. Applying the same fix to both keeps the codebase consistent and avoids the trap of "we fixed it in one place." |

## What was built

**Modified files:**
- [`src/app/api/orders/route.ts`](../../src/app/api/orders/route.ts) — Stock validation moved inside `$transaction`; product rows locked with `SELECT ... FOR UPDATE` before checking quantity.
- [`src/app/api/inventory/adjustments/route.ts`](../../src/app/api/inventory/adjustments/route.ts) — Same pattern: lock product row, validate stock from locked data, create adjustment + update stock atomically.

**New test files:**
- [`src/app/api/orders/__tests__/route.test.ts`](../../src/app/api/orders/__tests__/route.test.ts) — Tests for sufficient stock, insufficient stock, FOR UPDATE locking pattern, and stock check inside transaction.
- [`src/app/api/inventory/adjustments/__tests__/route.test.ts`](../../src/app/api/inventory/adjustments/__tests__/route.test.ts) — Tests for positive adjustments, negative adjustments that would make stock negative, FOR UPDATE locking pattern, and stock check inside transaction.

## How it works

### Before: the race condition

```
Request A (Cashier 1)          Request B (Cashier 2)
─────────────────────          ─────────────────────
1. READ stock → 1
                               2. READ stock → 1
3. CHECK: 1 ≥ 1 ✅
                               4. CHECK: 1 ≥ 1 ✅
5. DECREMENT stock → 0
                               6. DECREMENT stock → -1  ← BUG
```

Both reads happen before either write. Both see the same stock level. Both pass the check.

### After: pessimistic locking

```
Request A (Cashier 1)          Request B (Cashier 2)
─────────────────────          ─────────────────────
1. BEGIN TRANSACTION
2. SELECT ... FOR UPDATE → 1
   (row locked)
                               3. BEGIN TRANSACTION
                               4. SELECT ... FOR UPDATE
                                  (BLOCKED — waits for lock)
5. CHECK: 1 ≥ 1 ✅
6. DECREMENT → 0
7. COMMIT (lock released)
                               4. SELECT ... FOR UPDATE → 0
                                  (lock acquired)
                               5. CHECK: 0 ≥ 1 ❌ → throws
                               6. ROLLBACK
```

Request B blocks at step 4 until Request A commits. By the time B reads the stock, A's decrement is already committed. B sees `stock = 0` and correctly fails.

### Orders API flow

```ts
const order = await prisma.$transaction(async (tx) => {
  // 1. Lock product rows — blocks concurrent requests
  const lockedProducts = await tx.$queryRaw`
    SELECT id, stock, name FROM "Product"
    WHERE id IN (${Prisma.join(productIds)})
    FOR UPDATE
  `;

  // 2. Check stock from locked data (same row that will be decremented)
  for (const item of items) {
    const product = lockedMap.get(item.productId);
    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }
  }

  // 3. Create order + items + decrement stock — all atomic
  const newOrder = await tx.order.create({ ... });
  await tx.orderItem.createMany({ ... });
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  return tx.order.findUnique({ where: { id: newOrder.id }, include: { items: true } });
});
```

**Key insight:** The `SELECT ... FOR UPDATE` is the critical step. It acquires a row-level lock on each product. Any other transaction trying to read the same rows with `FOR UPDATE` will block until this transaction commits or rolls back. The stock check then reads from the locked rows — guaranteeing it sees the latest committed value.

### Inventory adjustments flow

Same pattern, single row:

```ts
const adjustment = await prisma.$transaction(async (tx) => {
  // Lock single product row
  const [lockedProduct] = await tx.$queryRaw`
    SELECT id, stock FROM "Product"
    WHERE id = ${productId}
    FOR UPDATE
  `;

  // Check from locked data
  if (lockedProduct.stock + quantity < 0) {
    throw new Error('Insufficient stock');
  }

  // Create adjustment + update stock atomically
  await Promise.all([
    tx.inventoryAdjustment.create({ ... }),
    tx.product.update({ where: { id: productId }, data: { stock: lockedProduct.stock + quantity } }),
  ]);

  return adjustmentRecord;
});
```

**Key insight:** For adjustments, we compute `newStock` from the locked value rather than using `{ decrement: quantity }`. This ensures the final stock is based on the locked read, not a concurrent counter.

### Why `Prisma.join` matters

Raw SQL in Prisma needs safe interpolation:

```ts
// ❌ Unsafe — SQL injection risk
await tx.$queryRaw`
  SELECT id, stock FROM "Product"
  WHERE id IN (${productIds})
  FOR UPDATE
`;

// ✅ Safe — Prisma.join handles array interpolation
await tx.$queryRaw`
  SELECT id, stock FROM "Product"
  WHERE id IN (${Prisma.join(productIds)})
  FOR UPDATE
`;
```

`Prisma.join` converts the array to a comma-separated list of parameterized values. It's the Prisma equivalent of prepared statement binding for arrays.

## Trade-offs & gotchas

### What we gave up

| Trade-off | Cost | Mitigation |
|---|---|---|
| **Reduced concurrency** | Concurrent requests for the same product serialize — second waits for first to finish | Acceptable for demo scale (~200 products, single store). Real systems might use optimistic locking with retry for high-throughput scenarios. |
| **Raw SQL for locking** | `FOR UPDATE` isn't available in Prisma's query builder — requires `$queryRaw` | Confined to two endpoints. The raw query is small and well-tested. Prisma's type safety still applies to the rest of the transaction. |
| **No deadlock protection** | If two transactions lock products in different orders, they could deadlock | Unlikely in practice — orders lock by product ID array (sorted), adjustments lock one product at a time. PostgreSQL's deadlock detector would resolve it anyway by aborting one transaction. |

### Sharp edges

- **Lock scope:** `FOR UPDATE` locks rows, not tables. Only concurrent requests for the *same* product block. Different products proceed in parallel.
- **Lock duration:** The lock is held for the entire transaction — from `FOR UPDATE` to `COMMIT`. Long-running transactions (e.g., with external API calls) would hold locks longer. Our transactions are short (DB writes only), so this isn't an issue.
- **`$queryRaw` typing:** The raw query returns `{ id: number; stock: number; name: string }[]`. The type annotation is manual — Prisma can't infer types from raw SQL. A schema change that renames `stock` would break silently at runtime.
- **Callback vs array syntax:** We use callback syntax (`prisma.$transaction(async (tx) => {...})`) because we need the `tx` client for `$queryRaw`. Array syntax (`prisma.$transaction([op1, op2])`) doesn't expose `tx` and can't use `FOR UPDATE`.

## Explore it yourself

**Files to open:**
1. [`src/app/api/orders/route.ts`](../../src/app/api/orders/route.ts) — Orders API with pessimistic locking
2. [`src/app/api/inventory/adjustments/route.ts`](../../src/app/api/inventory/adjustments/route.ts) — Inventory adjustments with pessimistic locking
3. [`src/app/api/orders/__tests__/route.test.ts`](../../src/app/api/orders/__tests__/route.test.ts) — Order locking tests
4. [`src/app/api/inventory/adjustments/__tests__/route.test.ts`](../../src/app/api/inventory/adjustments/__tests__/route.test.ts) — Adjustment locking tests

**Commands to run:**
```bash
# Run the tests
npx vitest src/app/api/orders/__tests__/route.test.ts
npx vitest src/app/api/inventory/adjustments/__tests__/route.test.ts

# Check TypeScript compilation
npx tsc --noEmit

# Start dev server and test manually
npm run dev
```

**Try it:**
1. Open two browser windows, both logged in as cashier
2. Find a product with stock = 1
3. Add it to both carts
4. Click "Pay" in both windows simultaneously
5. One succeeds, one fails with "Insufficient stock" — no overselling

---

*Phase: 06-Atomic Transactions*
*Learn file created: 2026-07-08*
