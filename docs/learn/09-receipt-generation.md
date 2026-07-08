# Chapter 9 — Receipt Generation

> After a customer pays, they need proof of purchase. This chapter replaces the minimal "Success" modal with a full thermal-style receipt that shows every detail of the transaction.

## The problem

The checkout flow worked — items were deducted from inventory, orders were created, the cart was cleared. But when the cashier clicked "Pay," all the customer saw was a tiny modal that said "Success" and auto-dismissed after 3 seconds.

For a real store:

- No record the customer can hold
- No way to print proof of purchase
- No itemized breakdown visible after checkout
- The auto-dismiss meant the cashier had to rush to show the customer what they bought

The API already returned the order data, but it didn't include product names or SKUs — just IDs and prices. The receipt needed product details, not database IDs.

## The rationale

| Decision | Why |
|---|---|
| **`@media print` with `.receipt-printable` class** | Browser print APIs are tricky — you need to hide everything except what you want printed. A scoped CSS class lets us target exactly the receipt content. |
| **Thermal receipt layout (narrow, monospace)** | Receipts have a distinct visual language. Monospace fonts for numbers ensure alignment. Narrow width mimics thermal printers. |
| **Remove auto-dismiss** | The old 3-second auto-dismiss was a UX problem — customers couldn't read the receipt in time. Let the user close it explicitly. |
| **Enhance POST /api/orders with `include: product`** | The receipt needs product names, not just IDs. Adding the Prisma `include` to the existing endpoint avoids a separate fetch. |
| **Null guard on `orderData`** | When the dialog closes, React re-renders before state settles. Without a null guard, `orderData.orderNumber` crashes. Defensive coding for a timing edge case. |

## What was built

**New files:**
- [`src/components/pos/receipt.tsx`](../../src/components/pos/receipt.tsx) — Receipt dialog component with thermal layout, print CSS, and receipt data interface
- [`src/components/pos/__tests__/receipt.test.tsx`](../../src/components/pos/__tests__/receipt.test.tsx) — 4 tests covering item rendering, totals, payment method, and print behavior
- [`vitest.config.ts`](../../vitest.config.ts) — Vitest configuration with jsdom environment for component testing
- [`vitest.setup.ts`](../../vitest.setup.ts) — Vitest setup for testing-library matchers

**Modified files:**
- [`src/app/api/orders/route.ts`](../../src/app/api/orders/route.ts) — POST response now includes product name and SKU via Prisma `include`
- [`src/app/pos/page.tsx`](../../src/app/pos/page.tsx) — PaymentDialog imports Receipt, maps API response to receipt data, removes auto-dismiss

## How it works

### The data flow

```
Cashier clicks Pay
  → POST /api/orders (creates order, returns items with product details)
    → PaymentDialog maps response to ReceiptOrderData (Number() for Prisma Decimals)
      → Receipt component renders in Dialog
        → Customer sees receipt, can Print or Close
```

### Receipt component structure

The Receipt is a client component that renders inside a shadcn Dialog:

```
<Dialog open={!!success} onOpenChange={...}>
  <style>  ← @media print rules
  <DialogContent className="receipt-printable">
    ├── DialogHeader: "RETAIL POS" + subtitle
    ├── Separator
    ├── Order info: number + formatted date
    ├── Separator
    ├── Items list: name, SKU, qty × price = total
    ├── Separator
    ├── Totals: subtotal, tax, total
    ├── Separator
    ├── Payment method
    ├── "Simulated receipt" footer
    └── DialogFooter: Print + Close buttons
```

### Print CSS pattern

The key insight: `@media print` lets you override styles only when the browser's print dialog opens. The pattern:

```css
@media print {
  body * { visibility: hidden; }           /* hide everything */
  .receipt-printable,
  .receipt-printable * { visibility: visible; }  /* show receipt */
  .receipt-printable {
    position: absolute;
    left: 0; top: 0;
    width: 100%;
    background: white;
  }
}
```

The `.receipt-printable` class is applied to `DialogContent`, so only the receipt content prints — no dialog overlay, no buttons, no page chrome.

### Prisma Decimal handling

Prisma returns `Decimal` types as strings. The `Number()` conversion happens in PaymentDialog when mapping the API response:

```typescript
subtotal: Number(order.subtotal),
tax: Number(order.tax),
items: order.items.map(item => ({
  ...item,
  price: Number(item.price),
  total: Number(item.total),
})),
```

### The null guard

When the user closes the receipt dialog:
1. `onOpenChange(false)` fires
2. `setSuccess(null)` runs
3. React re-renders — `open={!!success}` becomes `false`, but `orderData={success}` is now `null`

Without the guard `if (!orderData) return null` at the top of Receipt, the component tries to access `orderData.orderNumber` on null and crashes.

## Trade-offs & gotchas

| Trade-off | What we gave up |
|---|---|
| **`window.print()` opens browser print dialog** | Can't customize print settings programmatically (margins, paper size). Acceptable for a demo — real POS systems use thermal printer APIs. |
| **`@media print` CSS in a `<style>` tag** | Not extracted to a separate stylesheet. Fine for a single component, but reusable print styles would need extraction. |
| **Prisma Decimal → Number in the client** | Precision loss for very large numbers. Fine for a demo store (< $1M transactions), but real financial apps use `Decimal` all the way through. |
| **No print receipt ID on the printed output** | The receipt shows order number and timestamp, but not a unique receipt ID. Acceptable for a demo. |

**Gotchas:**
- `@media print` rules persist after printing — if you print again without reloading, the old rules still apply. The `<style>` tag is re-injected each render, so this is handled.
- The `showCloseButton={false}` on DialogContent hides the X button — only the explicit Close button in the footer works. This prevents accidental dismissal.
- `font-mono` on amounts ensures alignment. Without it, `$1.00` and `$100.00` have different widths and look misaligned.

## Explore it yourself

**Files to open:**
- [`src/components/pos/receipt.tsx`](../../src/components/pos/receipt.tsx) — The Receipt component with print CSS
- [`src/app/pos/page.tsx`](../../src/app/pos/page.tsx) — How PaymentDialog maps API data to receipt format
- [`src/app/api/orders/route.ts`](../../src/app/api/orders/route.ts) — The Prisma `include: product` pattern
- [`vitest.config.ts`](../../vitest.config.ts) — Vitest configuration for component tests

**Commands to run:**
```bash
# Start the dev server
npm run dev

# Run receipt tests
npx vitest run src/components/pos/__tests__/receipt.test.tsx

# Type check
npx tsc --noEmit
```

**Try it:**
1. Open the POS terminal (`/pos`)
2. Add items to the cart
3. Click Pay → select a payment method → confirm
4. The Receipt dialog appears with all items, totals, and timestamps
5. Click Print → browser print dialog shows only the receipt (thermal style)
6. Click Close → receipt dismisses, POS returns to normal
