# Design System Refactor Plan

## UI Audit Summary

Key inconsistencies found across 7 pages:

| Issue | Before |
|-------|--------|
| Section spacing | `space-y-6` (Products) vs `space-y-8` (Dashboard) vs none (New/Edit) |
| Page headers | 3 different flex patterns across pages |
| Tables | Dashboard uses raw Table, Products uses DataTable |
| Badges | Dashboard uses inline `bg-emerald-100`, Products uses `StatusBadge` component |
| Empty states | 4 different icon sizes (h-8 to h-12), 4 different opacity levels |
| Loading | Skeleton in admin, raw `animate-pulse` divs in POS |
| Border opacity | `/50` vs `/60` vs full — no rule |
| Shadow | `shadow-xs` → `shadow-lg` — 4 levels, no system |
| Radius | `rounded-md` / `rounded-lg` / `rounded-xl` — no clear rules |
| Card padding | Component uses `--card-spacing`, pages override with `pt-6` |
| Forms | Manual textarea instead of shared Textarea component |

## Approach: Shared Component Library + Page Refactor

### New shared components to create:

| Component | Purpose | File |
|-----------|---------|------|
| `PageContainer` | Wraps page content with consistent spacing | `src/components/dashboard/page-container.tsx` |
| `PageHeader` | Title + description + action buttons | `src/components/dashboard/page-header.tsx` |
| `EmptyState` | Icon + title + description + CTA | `src/components/dashboard/empty-state.tsx` |
| `LoadingSpinner` | Centered spinner for full-page loads | `src/components/dashboard/loading-spinner.tsx` |

### Existing components to standardize:

| Component | Fix |
|-----------|-----|
| `DataTable` | Already good — becomes the only table pattern |
| `StatusBadge` | Already good — used everywhere |
| `DataTablePagination` | Replace native `<select>` with shadcn Select |

### Pages to refactor:

1. **Dashboard** (`admin/page.tsx`) — Use `DataTable` instead of raw Table, use `StatusBadge`, use `PageContainer`/`PageHeader`
2. **New Product** (`admin/products/new/page.tsx`) — Use `PageContainer`/`PageHeader`
3. **Edit Product** (`admin/products/[id]/edit/page.tsx`) — Use `PageContainer`/`PageHeader`
4. **Products List** (`admin/products/page.tsx`) — Already uses DataTable, just update to use `PageContainer`/`PageHeader`
5. **Login** — Leave as-is (intentionally different design, centered card)
6. **POS Terminal** — Leave as-is (intentionally different: touch-first, full-screen, two-panel)

### Design tokens to standardize:

- **Section spacing:** `space-y-6` everywhere (admin pages)
- **Border opacity:** `border-border/60` for cards/tables, `border-border` for inputs
- **Shadows:** `shadow-sm` for cards/containers, `shadow-md` on hover
- **Empty state icon:** `h-10 w-10` with `text-muted-foreground/40`, `rounded-xl bg-muted p-3` container
- **Page header:** Always `flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`

## Implementation Order

1. Create shared dashboard components (PageContainer, PageHeader, EmptyState, LoadingSpinner)
2. Refactor Products List to use new shared components
3. Refactor Dashboard to use DataTable + StatusBadge + shared components
4. Refactor New/Edit Product pages to use shared components
5. Build & verify
