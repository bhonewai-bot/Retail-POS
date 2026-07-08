# Learn This Project

A guided tour of the **Retail POS** system. These files document what was built, the problems it solves, and the rationale behind decisions.

## How to read these docs

Every chapter follows the same shape:

1. **The problem** — what we needed and what made it hard.
2. **What was built** — the concrete files and pieces.
3. **How it works** — the concepts and the data/control flow.
4. **Trade-offs & gotchas** — what we gave up, and the sharp edges.
5. **Explore it yourself** — files to open and commands to run.

Code references like [`lib/prisma.ts`](../../lib/prisma.ts) are clickable.

## Project status

**Completed:**
- ✅ Foundation — Prisma schema, database client, data models, design system, POS terminal
- ✅ Authentication — Better Auth, login, role-based access, route protection
- ✅ Product Management — CRUD API, admin UI, categories, search
- ✅ Inventory Tracking — Stock levels, low-stock alerts
- ✅ Inventory Adjustments — Manual adjustments with history
- ✅ Checkout Flow — Cart, simulated payment, order creation, atomic stock decrement
- ✅ Atomic Transactions — Pessimistic locking for race condition handling
- ✅ Transaction History — View and filter transaction records
- ✅ Receipt Generation — Post-checkout receipts with print support

## Phases

| # | Chapter | Status | What it delivers |
|---|---------|--------|------------------|
| 1 | [Foundation](01-foundation.md) | ✅ Built | Prisma schema, database client, data models, design system, POS terminal |
| 2 | [Authentication](02-authentication.md) | ✅ Built | Better Auth, login, role-based access, route protection |
| 3 | [Product Management](03-product-management.md) | ✅ Built | Product CRUD API, admin UI, categories, search |
| 4 | [Inventory Tracking](04-inventory-tracking.md) | ✅ Built | Stock levels, low-stock alerts |
| 5 | [Inventory Adjustments](05-inventory-adjustments.md) | ✅ Built | Manual adjustments with history |
| 6 | [Checkout Flow](06-checkout-flow.md) | ✅ Built | Cart, simulated payment, order creation, atomic stock decrement |
| 7 | [Atomic Transactions](07-atomic-transactions.md) | ✅ Built | Pessimistic locking for race condition handling |
| 8 | [Transaction History](08-transaction-history.md) | ✅ Built | View and filter transaction records |
| 9 | [Receipt Generation](09-receipt-generation.md) | ✅ Built | Post-checkout receipts with print support |

*Learn files are created after each phase is implemented.*

## Tech stack at a glance

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui (vega/zinc preset)
- **Database:** PostgreSQL + Prisma 7 (driver adapter)
- **Auth:** Better Auth (email/password, cookie sessions)
- **Tables:** TanStack Table (column-driven DataTable)
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **State:** Server Components + Client Components + useReducer (cart)
- **Runtime:** Node.js

## Business context

This is a **demo project** for practicing full-stack development. It simulates a retail POS system for a small store (~200 products).

**Primary users:**
- **Cashiers** — process sales at the POS terminal
- **Managers** — manage products, inventory, view reports

**MVP scope (2 days):**
- Product management with categories
- Inventory tracking with low-stock alerts
- Checkout flow (no real payment processing yet)
- Transaction history
- User authentication (cashier/manager roles)
- Search functionality
- Receipt generation

**Deferred to Phase 2:**
- Stripe payment integration
- UI polish and design refinement
- Security hardening
- Code refactoring

---

*Last updated: 2026-07-08 after receipt generation implementation*
