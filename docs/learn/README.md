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

**Currently implemented:**
- ✅ Database schema and Prisma setup (Phase 1)

**In progress:**
- ⏳ Project planning (see `.planning/` for ROADMAP.md)

**Not yet implemented:**
- ❌ Authentication
- ❌ Admin panel
- ❌ POS interface
- ❌ Checkout flow
- ❌ Transaction history
- ❌ Search
- ❌ Receipts

## Phases

| # | Chapter | Status | What it delivers |
|---|---------|--------|------------------|
| 1 | [Foundation](01-foundation.md) | ✅ Built | Prisma schema, database client, data models |
| 2 | TBD | ⏳ Planned | Authentication (cashier vs manager) |
| 3 | TBD | ⏳ Planned | Admin panel (product CRUD, inventory) |
| 4 | TBD | ⏳ Planned | POS interface (checkout, cart, sales) |
| 5 | TBD | ⏳ Planned | Transaction history & reporting |
| 6 | TBD | ⏳ Planned | Search & receipts |
| 7 | TBD | ⏳ Planned | Polish, security, refactoring |

*Learn files will be created after each phase is implemented.*

## Tech stack at a glance

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL + Prisma (driver adapter)
- **Auth:** TBD (likely NextAuth/Auth.js)
- **State:** Server Components + Server Actions
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

*Last updated: 2026-07-06 after foundation setup*
