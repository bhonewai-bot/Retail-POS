# Roadmap: Retail POS

## Overview

This roadmap delivers a complete point-of-sale system through 8 focused phases. The journey starts with authentication (the foundation), builds through product and inventory management, implements checkout flow with race condition handling, and finishes with transaction history, search, and receipt generation. Each phase delivers one coherent capability that builds on the previous phase.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Authentication** - Users can log in with role-based access and persistent sessions
- [ ] **Phase 2: Product Management** - Managers can create, edit, list, and search products
- [ ] **Phase 3: Inventory Tracking** - Managers can monitor stock levels and receive low-stock alerts
- [ ] **Phase 4: Inventory Adjustments** - Managers can adjust inventory quantities with history
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
**Plans**: TBD

Plans:
- [ ] 01-01: TBD

### Phase 2: Product Management
**Goal**: Managers can create, edit, list, and search products
**Depends on**: Phase 1
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04, SEARCH-01
**Success Criteria** (what must be TRUE):
  1. Manager can create products with name, SKU, price, cost, and category assignment
  2. Manager can edit existing product information
  3. Manager can deactivate products (mark as unavailable without deleting)
  4. Product list displays with pagination for ~200 products
  5. Products can be searched by name or SKU with instant filtering
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: Inventory Tracking
**Goal**: Managers can monitor stock levels and receive low-stock alerts
**Depends on**: Phase 2
**Requirements**: INV-01, INV-02, INV-03
**Success Criteria** (what must be TRUE):
  1. System displays current stock quantity for each product
  2. Visual alerts appear when stock falls below threshold
  3. Manager can manually adjust inventory quantities (receive stock, mark damage, etc.)
  4. Inventory changes are logged with timestamps and reasons
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Inventory Adjustments
**Goal**: Managers can adjust inventory quantities with full history tracking
**Depends on**: Phase 3
**Requirements**: INV-01, INV-02, INV-03
**Success Criteria** (what must be TRUE):
  1. Manager can increase or decrease stock quantities from inventory screen
  2. Adjustment reasons are captured (stock receipt, damage, count adjustment, etc.)
  3. Inventory adjustment history is visible and auditable
  4. Stock levels update correctly in real-time after adjustments
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

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
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Atomic Transactions
**Goal**: System handles concurrent inventory updates safely without race conditions
**Depends on**: Phase 5
**Requirements**: INV-04
**Success Criteria** (what must be TRUE):
  1. When two cashiers sell the same last item simultaneously, only one sale succeeds
  2. Inventory is decremented atomically as part of transaction processing
  3. No overselling occurs under concurrent checkout scenarios
  4. Failed transactions due to stock unavailability display clear error message
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

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
| 1. Authentication | 0/TBD | Not started | - |
| 2. Product Management | 0/TBD | Not started | - |
| 3. Inventory Tracking | 0/TBD | Not started | - |
| 4. Inventory Adjustments | 0/TBD | Not started | - |
| 5. Checkout Flow | 0/TBD | Not started | - |
| 6. Atomic Transactions | 0/TBD | Not started | - |
| 7. Transaction History | 0/TBD | Not started | - |
| 8. Receipt Generation | 0/TBD | Not started | - |
