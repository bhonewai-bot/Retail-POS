# Requirements: Retail POS

**Defined:** 2026-07-06
**Core Value:** Build a working POS system that demonstrates full-stack development patterns while learning authentication, inventory management, and transaction processing.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User can log in with email and password
- [x] **AUTH-02**: Role-based access (cashier vs manager)
- [x] **AUTH-03**: Session persists across browser refresh
- [x] **AUTH-04**: Cashiers can't access admin routes

### Product Management

- [ ] **PROD-01**: Manager can create products with name, SKU, price, cost, category
- [ ] **PROD-02**: Manager can edit existing products
- [ ] **PROD-03**: Manager can deactivate products (soft delete)
- [ ] **PROD-04**: Product list with pagination and search

### Inventory

- [x] **INV-01**: Inventory tracks stock quantity per product
- [x] **INV-02**: Low-stock alerts when quantity falls below threshold
- [x] **INV-03**: Manager can adjust inventory (receive stock, damage, etc.)
- [x] **INV-04**: Inventory decrements atomically on sale

### Checkout

- [ ] **CHECK-01**: Cashier can add products to cart by SKU/name — POS terminal UI built
- [ ] **CHECK-02**: Cart shows items with quantities and prices — POS terminal UI built
- [ ] **CHECK-03**: System calculates subtotal, tax, and total — POS terminal UI built
- [ ] **CHECK-04**: Cashier can complete transaction (simulated payment) — POS terminal UI built
- [ ] **CHECK-05**: Transaction creates order with line items — Plan 05-01

### Transaction History

- [ ] **TRANS-01**: Manager can view list of all transactions
- [ ] **TRANS-02**: Manager can view transaction details (line items)
- [ ] **TRANS-03**: Filter transactions by date range

### Search

- [ ] **SEARCH-01**: Search products by name or SKU
- [ ] **SEARCH-02**: Search results show product info and stock level

### Receipts

- [ ] **RECEIPT-01**: Generate receipt after checkout
- [ ] **RECEIPT-02**: Receipt shows items, totals, payment method, timestamp

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Payment Integration

- **PAY-01**: Stripe payment processing
- **PAY-02**: Card payment support
- **PAY-03**: Payment failure handling

### Advanced Features

- **ADV-01**: Customer management with loyalty points
- **ADV-02**: Discount/coupon system
- **ADV-03**: Multi-store support
- **ADV-04**: Barcode scanner integration

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real payment processing | Deferred to Phase 2 (Stripe integration) |
| Barcode scanner | Not available for demo |
| Multi-store support | Single store only for demo |
| Offline mode | Not needed for demo |
| Mobile app | Web-only for MVP |
| Advanced reporting | Basic transaction history sufficient for MVP |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| PROD-01 | Phase 2 | Pending |
| PROD-02 | Phase 2 | Pending |
| PROD-03 | Phase 2 | Pending |
| PROD-04 | Phase 2 | Pending |
| SEARCH-01 | Phase 2 | Pending |
| INV-01 | Phase 3 | Complete |
| INV-02 | Phase 3 | Complete |
| INV-03 | Phase 4 | Complete |
| CHECK-01 | Phase 5 | Ready |
| CHECK-02 | Phase 5 | Ready |
| CHECK-03 | Phase 5 | Ready |
| CHECK-04 | Phase 5 | Ready |
| CHECK-05 | Phase 5 | Ready |
| INV-04 | Phase 6 | Complete |
| TRANS-01 | Phase 7 | Pending |
| TRANS-02 | Phase 7 | Pending |
| TRANS-03 | Phase 7 | Pending |
| SEARCH-02 | Phase 2 | Pending |
| RECEIPT-01 | Phase 8 | Pending |
| RECEIPT-02 | Phase 8 | Pending |

**Coverage:**

- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-06*
*Last updated: 2026-07-07 after Phase 4 verification*
