# Roadmap: Retail POS

## Overview

This roadmap delivers a complete point-of-sale system through 8 focused phases. The journey starts with authentication (the foundation), builds through product and inventory management, implements checkout flow with race condition handling, and finishes with transaction history, search, and receipt generation. Each phase delivers one coherent capability that builds on the previous phase.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Authentication** - Users can log in with role-based access and persistent sessions (completed 2026-07-07)
- [x] **Phase 2: Product Management** - Managers can create, edit, list, and search products (completed 2026-07-07)
- [x] **Phase 3: Inventory Tracking** - Managers can monitor stock levels and receive low-stock alerts (completed 2026-07-07)
- [x] **Phase 4: Inventory Adjustments** - Managers can adjust inventory quantities with history (completed 2026-07-07)
- [ ] **Phase 5: Checkout Flow** - Cashiers can build carts, calculate totals, and process transactions
- [ ] **Phase 6: Atomic Transactions** - System handles concurrent inventory updates safely
- [ ] **Phase 7: Transaction History** - Managers can view and filter transaction records
- [ ] **Phase 8: Receipt Generation** - System generates receipts after successful checkout

## Phase Details

### Phase 1: Authentication

**Goal**: Users can securely log in with role-based access and persistent sessions
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):

  1. User can log in with email and password credentials
  2. Users with different roles (cashier vs manager) see different interface elements and routes
  3. User session persists across browser refresh and page navigation
  4. Cashier users cannot access manager-only routes (shown access denied or redirected)

**Plans**: 5/5 plans complete

Plans:

- [x] 01-01-PLAN.md — Install Better Auth and create server/client configuration
- [x] 01-02-PLAN.md — Extend Prisma schema with session/account/verification models
- [x] 01-03-PLAN.md — Create API route handler and full-page login UI
- [x] 01-04-PLAN.md — Implement middleware route protection and protected pages
- [x] 01-05-PLAN.md — Seed demo users and verify complete auth flow

### Phase 2: Product Management

**Goal**: Managers can create, edit, list, and search products
**Depends on**: Phase 1
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04, SEARCH-01, SEARCH-02
**Success Criteria** (what must be TRUE):

  1. Manager can create products with name, SKU, price, cost, and category assignment
  2. Manager can edit existing product information
  3. Manager can deactivate products (mark as unavailable without deleting)
  4. Product list displays with pagination for ~200 products
  5. Products can be searched by name or SKU with instant filtering
  6. Search results display product info and stock level

**Plans**: 2/2 plans complete

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Product API layer: category seed, CRUD endpoints, search endpoint

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — Admin UI: product list with search, create/edit forms, dashboard nav

### Phase 3: Inventory Tracking

**Goal**: Managers can monitor stock levels and receive low-stock alerts
**Depends on**: Phase 2
**Requirements**: INV-01, INV-02
**Success Criteria** (what must be TRUE):

  1. System displays current stock quantity for each product
  2. Visual alerts appear when stock falls below threshold

**Plans**: 2/2 plans complete

Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Inventory API: /api/inventory endpoint with stock-level data, low-stock filter, and search

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — Inventory admin UI: stock monitoring page with status badges, low-stock toggle, and search

### Phase 4: Inventory Adjustments

**Goal**: Managers can adjust inventory quantities with full history tracking
**Depends on**: Phase 3
**Requirements**: INV-01, INV-02, INV-03
**Success Criteria** (what must be TRUE):

  1. Manager can increase or decrease stock quantities from inventory screen
  2. Adjustment reasons are captured (stock receipt, damage, count adjustment, etc.)
  3. Inventory adjustment history is visible and auditable
  4. Stock levels update correctly in real-time after adjustments

**Plans**: 2/2 plans complete

Plans:
**Wave 1**

- [x] 04-01-PLAN.md — InventoryAdjustment schema model and adjustment API endpoints (POST create, GET history, GET detail)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-02-PLAN.md — Adjustment dialog, history component, and inventory page tab UI

### Phase 5: Checkout Flow

**Goal**: Cashiers can build carts, calculate totals, and complete transactions
**Depends on**: Phase 4
**Requirements**: CHECK-01, CHECK-02, CHECK-03, CHECK-04, CHECK-05
**Success Criteria** (what must be TRUE):

  1. Cashier can add products to cart by searching SKU or product name
  2. Cart displays line items with quantities, unit prices, and line totals
  3. System calculates subtotal, tax, and total amount
  4. Cashier can complete transaction with simulated payment (cash, card placeholder)
  5. Completed transaction creates order record with all line items

**Plans**: 1/1 plans complete

Plans:

- [x] 05-01-PLAN.md — Orders API endpoint and POS terminal order creation integration

### Phase 6: Atomic Transactions

**Goal**: System handles concurrent inventory updates safely without race conditions
**Depends on**: Phase 5
**Requirements**: INV-04
**Success Criteria** (what must be TRUE):

  1. When two cashiers sell the same last item simultaneously, only one sale succeeds
  2. Inventory is decremented atomically as part of transaction processing
  3. No overselling occurs under concurrent checkout scenarios
  4. Failed transactions due to stock unavailability display clear error message

**Plans**: 1 plan

Plans:

- [ ] 06-01-PLAN.md — Fix race conditions in orders and inventory APIs with pessimistic row locking

### Phase 7: Transaction History

**Goal**: Managers can view and filter transaction records
**Depends on**: Phase 6
**Requirements**: TRANS-01, TRANS-02, TRANS-03
**Success Criteria** (what must be TRUE):

  1. Manager can view list of all transactions with date, total, status
  2. Manager can click into transaction to see line items and details
  3. Transactions can be filtered by date range
  4. Transaction details include products, quantities, prices, and payment method

**Plans**: TBD

Plans:

- [ ] 07-01: TBD

### Phase 8: Receipt Generation

**Goal**: System generates receipts after successful checkout
**Depends on**: Phase 7
**Requirements**: RECEIPT-01, RECEIPT-02
**Success Criteria** (what must be TRUE):

  1. Receipt is generated and displayed immediately after checkout completion
  2. Receipt shows items purchased, quantities, unit prices, and totals
  3. Receipt includes payment method and transaction timestamp
  4. Receipt can be printed or saved (simulated)

**Plans**: TBD

Plans:

- [ ] 08-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Authentication | 5/5 | Complete    | 2026-07-07 |
| 2. Product Management | 2/2 | Complete | 2026-07-07 |
| 3. Inventory Tracking | 2/2 | Complete    | 2026-07-07 |
| 4. Inventory Adjustments | 2/2 | Complete    | 2026-07-07 |
| 5. Checkout Flow | 1/1 | Ready | - |
| 6. Atomic Transactions | 0/TBD | Not started | - |
| 7. Transaction History | 0/TBD | Not started | - |
| 8. Receipt Generation | 0/TBD | Not started | - |
