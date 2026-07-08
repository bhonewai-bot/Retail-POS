---
phase: 06-atomic-transactions
plan: 01
subsystem: api
tags: [race-condition, pessimistic-locking, for-update, transactions]
dependency_graph:
  requires: [04-01, 05-01]
  provides: [atomic-stock-checks]
  affects: [src/app/api/orders/route.ts, src/app/api/inventory/adjustments/route.ts]
tech_stack:
  added: [vitest]
  patterns: [SELECT-FOR-UPDATE, Prisma.$queryRaw, callback-syntax-transaction]
key_files:
  created:
    - src/app/api/orders/__tests__/route.test.ts
    - src/app/api/inventory/adjustments/__tests__/route.test.ts
  modified:
    - src/app/api/orders/route.ts
    - src/app/api/inventory/adjustments/route.ts
decisions:
  - "Used pessimistic locking (FOR UPDATE) instead of optimistic concurrency — simpler for single-store scale"
  - "Kept manager user lookup outside transaction — read-only, not a contested resource"
  - "Switched inventory adjustments from array syntax to callback syntax to support $queryRaw inside transaction"
metrics:
  duration: 427s
  completed: 2026-07-08T02:57:50Z
  tasks: 2
  files: 4
status: complete
---

# Phase 6 Plan 01: Fix Race Conditions Summary

Pessimistic row locking (SELECT ... FOR UPDATE) in orders and inventory adjustments APIs to prevent overselling under concurrent checkout.

## What Was Done

### Task 1: Orders API Race Condition Fix
- **File:** `src/app/api/orders/route.ts`
- Removed the separate stock-check block that ran outside the transaction (product.findMany + loop)
- Added `SELECT ... FOR UPDATE` inside `$transaction` to lock product rows before stock validation
- Used `Prisma.join()` for safe interpolation of product IDs in the raw query
- Stock check now happens after rows are locked, preventing concurrent overselling
- Improved error handling to return 400 for stock-related errors (was always 500)

### Task 2: Inventory Adjustments API Race Condition Fix
- **File:** `src/app/api/inventory/adjustments/route.ts`
- Removed the separate stock-check block that ran outside the transaction (product.findUnique + newStock calculation)
- Switched from array syntax `prisma.$transaction([...])` to callback syntax `prisma.$transaction(async (tx) => { ... })` to enable `$queryRaw` inside the transaction
- Added `SELECT ... FOR UPDATE` to lock the product row before stock validation
- Stock check now happens after the row is locked, preventing concurrent negative adjustments
- Improved error handling to return 400 for stock-related errors (was always 500)

### POS Terminal (No Change Needed)
- The existing `toast.error('Payment failed', { description: errorData.error })` in `src/app/pos/page.tsx` already displays API error messages
- The improved error messages from the API (e.g., "Insufficient stock for Product X") will now appear in the toast

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Generated Prisma client missing in worktree**
- **Found during:** Task 1 implementation
- **Issue:** The worktree was based on an older commit and did not have the generated Prisma client (`src/generated/prisma/`)
- **Fix:** Ran `npx prisma generate` to create the generated client; merged main into worktree to get missing source files
- **Files modified:** (infrastructure only, no application code)
- **Commit:** part of merge + Task 1

**2. [Rule 3 - Blocking] TypeScript import path for Prisma namespace**
- **Found during:** Task 1 TypeScript compilation
- **Issue:** `import { Prisma } from '@/generated/prisma'` failed because the `@/*` path alias maps to `./src/*` but the generated client needed a relative path
- **Fix:** Used relative imports: `../../../generated/prisma/client` (orders) and `../../../../generated/prisma/client` (adjustments)
- **Files modified:** `src/app/api/orders/route.ts`, `src/app/api/inventory/adjustments/route.ts`
- **Commit:** fa839e5, 27afaf3

### Deviation Notes

**3. [TDD Infrastructure] Added vitest for test framework**
- **Found during:** Task 1 RED phase
- **Issue:** Plan specified `tdd="true"` but no test framework existed in the project
- **Fix:** Installed vitest as a dev dependency; created pattern-based tests that verify the locking contract
- **Files modified:** `package.json`, `package-lock.json`
- **Commit:** part of Task 1

## Known Stubs

None — all implementation is complete and functional.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: sql-injection | src/app/api/orders/route.ts | Raw SQL via `$queryRaw` with `Prisma.join()` — mitigated by Prisma's parameterized query interpolation |
| threat_flag: sql-injection | src/app/api/inventory/adjustments/route.ts | Raw SQL via `$queryRaw` with parameterized `productId` — mitigated by Prisma's parameterized query interpolation |

## Verification Evidence

```
=== Acceptance Criteria ===
Orders API:
  FOR UPDATE count: 2
  tx.$queryRaw count: 1
  product.findMany count: 0 (removed)
  Insufficient stock count: 2

Adjustments API:
  FOR UPDATE count: 2
  tx.$queryRaw count: 1
  product.findUnique count: 0 (removed)
  Insufficient stock count: 2

TypeScript: 0 errors in target files
Tests: 2 files, 8 tests passed
```

## Self-Check: PASSED

All files exist and commits verified:
- `fa839e5` — Task 1: orders API race condition fix
- `27afaf3` — Task 2: inventory adjustments API race condition fix
