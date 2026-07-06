# Domain Pitfalls: Retail POS System

**Domain:** Point of Sale / Checkout System
**Researched:** 2026-07-06
**Overall confidence:** HIGH

---

## Critical Pitfalls

Mistakes that cause data loss, overselling, or financial discrepancies.

### 1. Inventory Race Condition (Two Cashiers, Last Item)

**What goes wrong:** Two cashiers simultaneously ring up the last item in stock. Both transactions read inventory count as 1, both decrement and write 0. Result: 2 items sold, 1 in stock (oversold).

**Why it happens:** Read-modify-write race on inventory quantity without concurrency control.

**Consequences:**
- Overselling (negative inventory or phantom stock)
- Customer dissatisfaction (ordered but out of stock)
- Accounting discrepancies
- Inventory audits fail

**Prevention:**
- **Use atomic conditional update:** `UPDATE inventory SET quantity = quantity - 1 WHERE quantity >= 1`
- **Optimistic locking with version column:** Check version at update time, retry on conflict
- **Pessimistic locking:** `SELECT ... FOR UPDATE` for high-contention items
- **Reserve inventory on cart add:** Temporarily hold stock during checkout with timeout

**Detection:**
- Negative inventory counts
- Oversell alerts during peak hours
- Inventory audit failures

**Confidence:** HIGH

---

### 2. Price Snapshot Not Captured at Transaction Time

**What goes wrong:** Price is fetched from product table at checkout time, but if price changes between add-to-cart and payment processing, the customer pays the wrong amount.

**Why it happens:** Optimistic assumption that price won't change; storing only reference to product table, not snapshot.

**Consequences:**
- Customer overcharged or undercharged
- Reconciliation failures (transaction amount ≠ inventory record)
- Audit trails become unreliable
- Refunds cannot match original transaction amount

**Prevention:**
- **Snapshot price at add-to-cart:** Store unit price, tax rate, discount in `order_items` table immediately
- **Immutability:** Never update `order_items.price` after creation
- **Audit log:** Record price changes with timestamps for traceability

**Detection:**
- Price mismatches between transactions and current product prices
- Refund calculations that don't match original charges

**Confidence:** HIGH

---

### 3. Transaction Not Atomic (Partial Updates on Failure)

**What goes wrong:** Transaction fails midway through processing—inventory decremented but payment not recorded, or payment processed but inventory not updated. System is now in inconsistent state.

**Why it happens:** Multiple database operations not wrapped in a single transaction; network failures between operations.

**Consequences:**
- Inventory count wrong (decremented without sale recorded)
- Payment recorded but inventory not decremented
- Reconciliation reports are unreliable
- Hard to identify and fix manual corrections needed

**Prevention:**
- **Database transactions:** Wrap all operations in single ACID transaction
- **Compensating transactions:** On failure, trigger compensating actions (e.g., re-increment inventory)
- **Saga pattern:** Orchestrate distributed operations with rollback capability
- **Idempotency keys:** Ensure retrying a failed transaction doesn't duplicate work

**Detection:**
- Inventory count mismatches with transaction history
- Payments recorded without corresponding inventory changes
- Database constraint violations on foreign keys

**Confidence:** HIGH

---

### 4. Payment Failure After Inventory Decrement (No Rollback)

**What goes wrong:** Payment is attempted after inventory is decremented. Payment fails (insufficient funds, network error), but system doesn't roll back inventory decrement. Item appears sold but wasn't paid for.

**Why it happens:** Payment happens after inventory change; no compensating transaction on payment failure.

**Consequences:**
- "Phantom" sale recorded (inventory down, payment missing)
- Item unavailable to next customer
- Financial reports show sales that didn't occur

**Prevention:**
- **Order-first pattern:** Create pending order, then attempt payment, then commit inventory on success
- **Compensating transactions:** Automatically re-increment inventory on payment failure
- **Outbox pattern:** Write changes atomically, then publish events asynchronously
- **DLQ (Dead Letter Queue):** Route failed compensations for manual review

**Detection:**
- Orders with "pending" status that never complete
- Inventory discrepancies between physical count and system
- Payment logs showing failures without corresponding voids

**Confidence:** HIGH

---

### 5. Double Charge / Duplicate Transaction

**What goes wrong:** Network timeout causes payment request to be sent but response lost. System retries payment, customer charged twice for same transaction.

**Why it happens:** Lack of idempotency; network unreliability; timeout handling too aggressive.

**Consequences:**
- Customer overcharged (must issue refund)
- Double inventory decrement (if not idempotent)
- Customer trust damaged
- Refund processing burden

**Prevention:**
- **Idempotency keys:** Generate UUID for each transaction, send with payment request
- **Payment provider idempotency:** Use Stripe/Square idempotency key headers
- **Database unique constraints:** Prevent duplicate transaction records
- **Client-side state tracking:** Track transaction status before retrying

**Detection:**
- Duplicate transaction IDs in logs
- Multiple payments for same order
- Customer complaints about double charges

**Confidence:** HIGH

---

## Moderate Pitfalls

Issues that cause friction, confusion, or operational overhead.

### 6. Price Inconsistency Across Cashier Terminals

**What goes wrong:** Price is updated in admin console, but some terminals show old prices due to caching, network lag, or failed synchronization. Different cashiers charge different amounts for same item.

**Why it happens:** Terminal caching with failed invalidation; network latency; offline mode conflicts.

**Consequences:**
- Customers see different prices at different registers
- Reconciliation becomes complex
- Compliance issues (prices must be accurate at point of sale)

**Prevention:**
- **Real-time price push:** Use WebSocket/SSE to push price updates instantly
- **Versioned prices:** Each price update gets version number; terminals validate version
- **Cache invalidation:** Explicit invalidation with TTL fallback
- **Offline mode with staleness detection:** Flag transactions if price data is stale

**Detection:**
- Price discrepancies in end-of-day reports by terminal
- Customer complaints about inconsistent pricing
- Audit logs showing price version mismatches

**Confidence:** HIGH

---

### 7. Cashier Session Timeout During Checkout (Cart Lost)

**What goes wrong:** Cashier is mid-checkout, session times out due to inactivity, cart contents lost. Customer waited in line only to have to start over.

**Why it happens:** Aggressive timeout settings; no session persistence; no save mechanism.

**Consequences:**
- Customer frustration and long lines
- Cashier frustration
- Lost sales if customer abandons

**Prevention:**
- **Session persistence:** Save cart to localStorage/IndexedDB before timeout
- **Grace period:** Warn cashier 60s before timeout, allow extend
- **Background save:** Persist cart state every 30 seconds
- **Recovery flow:** On re-login, restore previous cart

**Detection:**
- High cart abandonment rate at specific terminals
- Cashier reports of "lost carts"
- Session timeout logs correlating with abandonment

**Confidence:** MEDIUM

---

### 8. Offline Mode Data Sync Conflicts

**What goes wrong:** Terminal operates offline, processes multiple transactions, reconnects to sync. Conflicts arise with server data (inventory already changed, prices updated, etc.).

**Why it happens:** Offline transactions may conflict with concurrent online transactions; no conflict resolution strategy.

**Consequences:**
- Duplicate transactions
- Inventory mismatches
- Data corruption if conflicts not handled
- Loss of transaction data

**Prevention:**
- **Conflict resolution strategy:** Last-write-wins, merge-based, or manual review
- **Transaction queuing:** Queue offline transactions, replay in order on reconnect
- **Versioning:** Each transaction has version number for conflict detection
- **Audit log:** Track offline vs online source for each transaction

**Detection:**
- Sync errors on reconnection
- Duplicate transactions after sync
- Inventory discrepancies after offline period

**Confidence:** MEDIUM

---

### 9. Improper Void/Refund Handling (Audit Trail Gaps)

**What goes wrong:** Transactions voided or refunded without proper audit trail; financial records don't match. Staff can cover errors or theft.

**Why it happens:** Void/refund operations not logged; no approval workflow; database deletes instead of soft-deletes.

**Consequences:**
- Financial records inaccurate
- Potential fraud/theft
- Compliance violations (PCI-DSS requires audit trails)
- Refund reconciliation impossible

**Prevention:**
- **Immutable transaction log:** Never delete records, only append status changes
- **Approval workflow:** Require manager approval for refunds/voids above threshold
- **Audit trail:** Log who voided, when, why, with original transaction details
- **Soft deletes:** Use `is_voided` flag instead of DELETE

**Detection:**
- Voids/refunds without audit log entries
- Discrepancies between POS totals and bank deposits
- Unusual void/refund patterns by cashier

**Confidence:** HIGH

---

### 10. Cashier Session Management (Shared Credentials)

**What goes wrong:** Cashiers share login credentials; no individual tracking; can't attribute transactions or errors to specific person.

**Why it happens:** Inconvenience of logging in/out; lack of role-based access; poor UX.

**Consequences:**
- Cannot track individual performance
- Cannot trace errors to specific cashier
- Security risk (unauthorized access)
- Audit trail incomplete

**Prevention:**
- **Quick login:** PIN-based or badge-based fast login (< 2 seconds)
- **Shift management:** Cashier logs in at shift start, logs out at shift end
- **Auto-logout:** Timeout after inactivity, require re-authentication
- **Session isolation:** Each cashier has separate session/cart

**Detection:**
- Multiple cashiers using same credentials
- Transactions without cashier attribution
- Audit logs with generic "admin" user

**Confidence:** HIGH

---

## Minor Pitfalls

Issues that cause friction or inefficiency but not data loss.

### 11. Checkout Flow UX Mistakes (Cart Abandonment)

**What goes wrong:** Checkout flow has too many steps, hidden fees, confusing navigation. Customers abandon checkout (avg 70% cart abandonment rate in e-commerce).

**Why it happens:** Poor UX design; friction at every step; surprise costs.

**Consequences:**
- Lost sales
- Customer frustration
- Increased support tickets

**Prevention:**
- **Minimal steps:** Progress indicator showing "Step 2 of 3"
- **Clear pricing:** Show taxes/fees early in flow, not just at final step
- **Easy navigation:** Allow back-navigation without losing entered data
- **Guest checkout:** Don't force account creation
- **Fast load times:** Optimize checkout page performance

**Detection:**
- High cart abandonment rate (track abandonment analytics)
- Customer complaints about checkout process
- Long time-to-complete metrics

**Confidence:** HIGH

---

### 12. Manual Entry Errors (Miskeyed Amounts/Products)

**What goes wrong:** Cashier enters wrong product code, wrong quantity, or wrong amount. Transaction recorded incorrectly.

**Why it happens:** Barcode scanner failure; manual entry required; human error.

**Consequences:**
- Wrong product recorded
- Wrong amount charged
- Inventory incorrect
- Customer dissatisfaction

**Prevention:**
- **Barcode scanning:** Primary input method, manual entry as fallback
- **Quantity confirmation:** Show product name/price before processing
- **Undo capability:** Allow voiding recent item before finalizing
- **Input validation:** Range checks, format validation on manual entry

**Detection:**
- High void rate
- Manual entry frequency (track percentage of manual vs scanned)
- Inventory discrepancies

**Confidence:** MEDIUM

---

### 13. Tax Calculation Errors (Jurisdiction/Rate Mistakes)

**What goes wrong:** Wrong tax rate applied to products; tax not calculated for correct jurisdiction; exemption rules not applied.

**Why it happens:** Complex tax rules; multiple jurisdictions; exemption certificates not tracked.

**Consequences:**
- Overcharged or undercharged customers
- Compliance violations
- Audit failures

**Prevention:**
- **Tax service integration:** Use dedicated tax calculation API (TaxJar, Avalara)
- **Location-aware tax:** Determine tax rate based on store location, not product location
- **Exemption management:** Track tax-exempt customers with valid certificates
- **Audit trail:** Log tax calculations with rates and jurisdiction

**Detection:**
- Tax discrepancies in financial reports
- Audit findings on tax calculations
- Customer complaints about tax amounts

**Confidence:** HIGH

---

### 14. Database Anti-Pattern: No Audit Trail

**What goes wrong:** Transactions, products, or inventory modified without logging. Cannot trace changes for compliance or debugging.

**Why it happens:** Performance concerns; database bloat; incomplete requirements.

**Consequences:**
- Cannot debug data issues
- Compliance violations (PCI-DSS, SOX)
- Cannot attribute changes to users
- Refunds/reconciliation impossible

**Prevention:**
- **Immutable audit log:** Append-only table for all changes
- **Change data capture:** Use database triggers or CDC to log changes
- **Soft deletes:** Never physically delete records
- **Version tracking:** Version numbers on all mutable entities

**Detection:**
- Missing change history for critical records
- Inability to explain data discrepancies
- Compliance audit failures

**Confidence:** HIGH

---

### 15. Database Anti-Pattern: Storing Payment Card Data

**What goes wrong:** System stores credit card numbers, CVVs, or full track data. Violates PCI-DSS; massive security liability.

**Why it happens:** Attempting to save payment info for convenience; not understanding PCI-DSS scope.

**Consequences:**
- PCI-DSS violations (fines up to $100K/month)
- Data breach liability
- Loss of payment processing privileges
- Legal liability

**Prevention:**
- **Use tokenization:** Never store card data, use tokens from payment processor
- **PCI-compliant processor:** Use Stripe, Square, PayPal (they handle card data)
- **Network segmentation:** Keep cardholder data environment separate
- **Encryption:** Encrypt any sensitive data that must be stored

**Detection:**
- Card data found in database tables
- PCI-DSS audit failures
- Security scans flagging card data storage

**Confidence:** HIGH

---

### 16. No Idempotency on Retry Logic

**What goes wrong:** Network error causes payment/transaction to retry without idempotency key. Same operation executed multiple times (double charge, double inventory decrement).

**Why it happens:** Naive retry logic; no consideration for duplicate execution.

**Consequences:**
- Duplicate charges
- Duplicate inventory decrements
- Data inconsistency
- Customer frustration

**Prevention:**
- **Idempotency keys:** Generate unique key per transaction, send with every request
- **Check before execute:** Before retrying, check if operation already completed
- **Database unique constraints:** Prevent duplicate records
- **Idempotent operations:** Design operations to be safely repeatable

**Detection:**
- Duplicate transaction IDs
- Multiple charges for same order
- Inventory decremented more times than sold

**Confidence:** HIGH

---

### 17. Receipt/Report Printing Failures During Checkout

**What goes wrong:** Receipt printer fails mid-print; transaction completed but customer has no receipt; no record for returns.

**Why it happens:** Hardware failure; driver issues; network printer connectivity.

**Consequences:**
- Customer cannot prove purchase
- Returns/refunds difficult without receipt
- Financial reconciliation gaps

**Prevention:**
- **Email receipts:** Offer digital receipt option
- **Print queue:** Queue receipts, retry on failure
- **Local cache:** Store receipt data locally until confirmed printed
- **Manual reprint:** Allow cashier to reprint from transaction history

**Detection:**
- Print job failures in logs
- Customer requests for duplicate receipts
- Returns without receipt requiring manual lookup

**Confidence:** MEDIUM

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| **Authentication/Session** | Shared credentials, no individual tracking | Quick PIN-based login, shift management |
| **Inventory Management** | Race conditions on last item | Atomic updates, optimistic locking, version columns |
| **Checkout Flow** | Cart timeout, hidden fees | Session persistence, early price disclosure |
| **Payment Processing** | Double charges, no idempotency | Idempotency keys, payment provider integration |
| **Transaction Recording** | Non-atomic operations | Database transactions, compensating patterns |
| **Refund/Void** | Missing audit trail | Immutable logs, approval workflow, soft deletes |
| **Reporting** | Price/timezone mismatches | Snapshot prices at transaction time, store UTC |
| **Offline Mode** | Sync conflicts on reconnect | Conflict resolution strategy, transaction versioning |

---

## Transaction Processing Checklist

To avoid pitfalls, ensure every transaction:

- [ ] **Atomic:** All operations in single transaction or saga
- [ ] **Idempotent:** Can safely retry without duplicate effects
- [ ] **Isolated:** Doesn't interfere with concurrent transactions
- [ ] **Durable:** Changes persisted to database before confirming to user
- [ ] **Audited:** All changes logged with timestamp and user
- [ ] **Priced:** Unit price, tax, discount snapshotted at transaction time
- [ ] **Inventory-managed:** Stock decremented only on successful payment
- [ ] **Recoverable:** System can recover from partial failure

---

## Database Design Anti-Patterns to Avoid

1. **Storing current prices only** → Snapshot prices in order_items
2. **Hard deletes** → Use soft deletes with audit logs
3. **Monolithic orders table** → Separate transactions, payments, line items, taxes
4. **No version columns** → Add version/timestamp for optimistic locking
5. **Application-only constraints** → Add database-level constraints
6. **Missing indexes on hot paths** → Index product search, barcode lookup, transaction history
7. **Ignoring timezone** → Store UTC, convert for display
8. **Over-normalizing** → Keep product data reasonably denormalized for performance
9. **Hardcoded business rules** → Use configuration tables or external service
10. **No event log** → Use event sourcing or change data capture for auditability

---

## Key Implementation Patterns

### Atomic Inventory Decrement
```sql
-- Safe: Only decrements if sufficient stock
UPDATE inventory
SET quantity = quantity - :amount,
    updated_at = NOW()
WHERE product_id = :product_id
  AND quantity >= :amount;

-- Check affected rows = 0 → insufficient stock
```

### Optimistic Locking
```sql
-- Check version before update
UPDATE products
SET price = :new_price,
    version = version + 1
WHERE id = :product_id
  AND version = :expected_version;

-- Check affected rows = 0 → conflict, retry
```

### Price Snapshot
```sql
-- At add-to-cart, store current price
INSERT INTO order_items (order_id, product_id, quantity, unit_price, tax_rate)
VALUES (:order_id, :product_id, :qty,
        (SELECT price FROM products WHERE id = :product_id),
        (SELECT tax_rate FROM products WHERE id = :product_id));
```

---

## Sources

- Database concurrency patterns: PostgreSQL documentation on transaction isolation, SELECT FOR UPDATE
- Idempotency patterns: Stripe API documentation, payment processing best practices
- Inventory management: Retail POS architecture patterns, e-commerce systems design
- PCI-DSS compliance: Payment Card Industry Data Security Standard v4.0
- Checkout UX: Baymard Institute research on cart abandonment
- Race condition solutions: Martin Fowler's writing on distributed systems patterns
