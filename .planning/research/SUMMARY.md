# Research Summary — Retail POS

## Key Findings

**Inventory race conditions** are the most critical issue — two cashiers selling the last item simultaneously causes overselling. Solution: atomic conditional updates with optimistic/pessimistic locking strategies.

**Price consistency** must be handled by snapshotting prices at transaction time, not referencing product table. Prices change; transaction records shouldn't.

**Transaction atomicity** is essential — all operations (inventory decrement, payment recording, order creation) must be wrapped in a single transaction or saga pattern with compensating actions.

**Audit trails** are non-negotiable — immutable logs, soft deletes, and approval workflows for refunds/voids are required for compliance and debugging.

## Critical Implementation Patterns

All patterns include SQL examples and application-level strategies:
- Atomic inventory decrement with conditional WHERE clause
- Optimistic locking with version columns
- Price snapshotting at add-to-cart
- Transaction processing checklist (8-point validation)
- Database anti-patterns to avoid (10 items)

## Phase Ordering Rationale

Based on pitfalls analysis:
1. **Authentication first** — foundation for everything else
2. **Inventory management next** — atomic operations must be in place before checkout
3. **Checkout flow after inventory** — uses inventory atomicity
4. **Transaction history last** — builds on transaction atomicity

## Key Takeaways for MVP

For this demo project, focus on:
1. ✅ Atomic inventory updates (use Prisma transactions)
2. ✅ Price snapshotting (store price on order items)
3. ✅ Basic error handling (prevent partial states)
4. ✅ Simple audit trail (log critical operations)

## Full Pitfalls Reference

See `.planning/research/PITFALLS.md` for detailed analysis of 17 categorized pitfalls with severity, consequences, prevention, and detection strategies.

---
*Synthesized: 2026-07-06*
