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
- ✅ Foundation — Prisma schema, database client, data models
- ✅ Authentication — Better Auth, login, role-based access, route protection

**Not yet implemented:**
- ❌ Product management (CRUD, search)
- ❌ Inventory tracking
- ❌ Checkout flow (cart, transactions)
- ❌ Transaction history & reporting
- ❌ Receipt generation

## Phases

| # | Chapter | Status | What it delivers |
|---|---------|--------|------------------|
| 1 | [Foundation](01-foundation.md) | ✅ Built | Prisma schema, database client, data models |
| 2 | [Authentication](02-authentication.md) | ✅ Built | Better Auth, login, role-based access, route protection |
| 3 | Product Management | ⏳ Planned | Product CRUD, categories, search |
| 4 | Inventory Tracking | ⏳ Planned | Stock levels, low-stock alerts |
| 5 | Inventory Adjustments | ⏳ Planned | Manual adjustments with history |
| 6 | Checkout Flow | ⏳ Planned | Cart, totals, simulated payment |
| 7 | Atomic Transactions | ⏳ Planned | Race condition handling |
| 8 | Transaction History | ⏳ Planned | View and filter records |
| 9 | Receipt Generation | ⏳ Planned | Post-checkout receipts |

*Learn files are created after each phase is implemented.*

## Tech stack at a glance

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL + Prisma 7 (driver adapter)
- **Auth:** Better Auth (email/password, cookie sessions)
- **State:** Server Components + Client Components
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

*Last updated: 2026-07-07 after authentication phase*
