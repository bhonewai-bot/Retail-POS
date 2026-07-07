# Phase 5: Checkout Flow - Context

**Gathered:** 2026-07-07
**Status:** Ready for replanning

<domain>
## Phase Boundary

Cashiers can build carts, calculate totals, and complete transactions. This phase delivers the core checkout functionality — from adding products to cart through payment simulation to order creation. The POS terminal UI was built in earlier phases; this phase adds the backend order persistence and connects the UI to the database.

</domain>

<decisions>
## Implementation Decisions

### Order Number Generation
- **D-01:** Keep random `ORD-YYYYMMDD-XXXX` format where XXXX is random 4-digit number (1000-9999). Provides 9000 combinations per day — sufficient for a demo with ~200 products and single-store operation. No need for sequential or timestamp-based approaches.

### Payment Simulation
- **D-02:** Keep 1500ms delay for simulated payment processing. Provides realistic feel for demo without adding complexity. No need for configurable delay or instant feedback.

### Error Handling
- **D-03:** Use toast-only error handling. When payment fails (insufficient stock, API error), show `toast.error` with descriptive message. Cart stays intact so cashier can retry or modify items. No error modal or retry button needed for demo.

### Cart Persistence
- **D-04:** Reset cart on page refresh. No localStorage or database persistence. Cart is in-memory only via React state. This simplifies implementation and avoids stale stock data issues.

### Payment Success Feedback
- **D-05:** Replace toast with auto-dismiss modal (3 seconds). Modal shows minimal information: order number, total amount, payment method. Modal auto-dismisses after 3 seconds — fast enough for POS workflow but visible enough for confirmation. Cart clears when modal appears.

### Claude's Discretion
- Toast notification styling and animation
- Modal transition effects (fade in/out)
- Loading states during API calls
- Button disabled states during processing

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Orders API
- `src/app/api/orders/route.ts` — POST (create order) and GET (list orders) endpoints
- `prisma/schema.prisma` §Order, OrderItem models — Database schema for orders

### POS Terminal
- `src/app/pos/page.tsx` — PaymentDialog component with handlePay function
- `src/components/pos/cart-store.tsx` — Cart state management (useCart hook)

### Existing API Patterns
- `src/app/api/inventory/adjustments/route.ts` — Reference for API error handling, validation, $transaction usage
- `src/app/api/products/route.ts` — Reference for pagination, serialization patterns

### Project Context
- `.planning/PROJECT.md` — Project goals, constraints, and scope
- `.planning/REQUIREMENTS.md` — Phase 5 requirements (CHECK-01 to CHECK-05)
- `.planning/ROADMAP.md` — Phase 5 success criteria

No external ADRs or specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Cart store** (`src/components/pos/cart-store.tsx`): Already has `useCart()` hook with `state.items`, `subtotal`, `tax`, `total`, `dispatch` — can be used to build success modal
- **Dialog component** (`src/components/ui/dialog.tsx`): Existing Dialog/DialogContent/DialogHeader/DialogTitle — can be reused for success modal
- **Toast library** (`sonner`): Already imported and used — can be kept for error handling while modal handles success

### Established Patterns
- **API route pattern** (`src/app/api/*/route.ts`): Try/catch with console.error, validation before DB calls, $transaction for atomicity
- **Client component pattern** (`'use client'` directive): POS page already marked as client component
- **Import aliases** (`@/*` → `./src/*`): All imports use this pattern

### Integration Points
- **PaymentDialog** (`src/app/pos/page.tsx:404-499`): Currently shows toast on success — needs update to show modal
- **Cart state** (`src/components/pos/cart-store.tsx`): `dispatch({ type: 'CLEAR' })` clears cart — should be called when success modal appears
- **Orders API** (`src/app/api/orders/route.ts`): Returns order object with `orderNumber` — modal needs to display this

</code_context>

<specifics>
## Specific Ideas

- User wants to understand the scope boundary between Phase 5 (checkout creation) and Phase 7 (transaction history viewing)
- Success modal should be minimal: order number, total, payment method — no item list
- 3-second auto-dismiss is fast enough for POS workflow (cashier needs to move quickly to next customer)
- Cart should clear immediately when success modal appears (not after modal dismisses)

</specifics>

<deferred>
## Deferred Ideas

- **Transaction history viewing** — belongs in Phase 7 (TRANS-01, TRANS-02, TRANS-03)
- **Receipt generation** — belongs in Phase 8 (RECEIPT-01, RECEIPT-02)
- **Atomic transactions under concurrency** — belongs in Phase 6 (INV-04)
- **Cart persistence across refreshes** — out of scope for demo (would require localStorage or database)
- **Configurable payment simulation delay** — out of scope for demo (1500ms is sufficient)

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-Checkout Flow*
*Context gathered: 2026-07-07*
