# Retail POS

## What This Is

A demo point-of-sale system for practicing full-stack development with Next.js, Prisma, and PostgreSQL. It simulates a retail environment for a small store (~200 products) with product management, inventory tracking, and checkout functionality.

## Core Value

Build a working POS system that demonstrates full-stack development patterns — from database schema through API to UI — while learning authentication, inventory management, and transaction processing.

## Business Context

- **Customer**: Demo project for portfolio/learning
- **Revenue model**: None (educational)
- **Success metric**: Completed MVP with authentication and checkout flow
- **Strategy notes**: Phase 1 MVP in 2 days, then iterate with polish and features

## Requirements

### Validated

- ✓ Database schema with Product, Category, Order, OrderItem, Customer, User models — existing
- ✓ Prisma client setup with PostgreSQL adapter — existing

### Active

- [ ] User authentication with role-based access (cashier vs manager)
- [ ] Product management interface (CRUD with categories)
- [ ] Inventory tracking with stock levels and low-stock alerts
- [ ] POS checkout interface (cart, totals calculation)
- [ ] Transaction history and basic reporting
- [ ] Search functionality for products (~200 items)
- [ ] Receipt generation after checkout

### Out of Scope

- Real payment processing (Stripe integration deferred to Phase 2)
- Barcode scanner integration (not available)
- Multi-store support (demo is single-store)
- Customer management (beyond basic info for MVP)
- Advanced reporting and analytics (deferred)
- Mobile app (web-only for now)
- Real-time inventory sync (not needed for demo)

## Context

This is a brownfield project with existing infrastructure:
- **Database schema already defined** — comprehensive models with proper indexing
- **Prisma configured** — client singleton, PostgreSQL adapter, generated types
- **Next.js app scaffold** — basic structure, no features implemented yet
- **Codebase mapped** — `.planning/codebase/` has architecture docs

The schema includes:
- Categories for product organization
- Products with SKU, barcode, pricing (price + cost for margin), stock levels
- Customers with loyalty points (for future use)
- Orders with status tracking (completed, refunded, voided)
- OrderItems linking orders to products with historical pricing
- Users with roles (admin, manager, cashier)

## Constraints

- **Tech stack**: Next.js + TypeScript + Tailwind + Prisma + PostgreSQL
- **Timeline**: 2 days for MVP, then iterate
- **Payment**: No real payment processing (simulated only)
- **Scale**: ~200 products, single store
- **Focus**: Authentication is main priority

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Prisma schema as data contract | Already defined, comprehensive, properly indexed | ✓ Good |
| Role-based auth (cashier/manager) | Simple RBAC sufficient for demo | — Pending |
| Defer Stripe integration | Time constraint, not essential for learning | — Pending |
| Store prices on order items | Preserve historical pricing for reporting | ✓ Good |
| Use decimal types for money | Prevents floating-point rounding errors | ✓ Good |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-06 after initialization*
