# Retail POS → SaaS Dashboard Redesign Plan

## Overview

Redesign the entire Retail POS UI from a basic layout to a modern, production-ready SaaS dashboard inspired by Stripe, Linear, Vercel, and Foodpanda Merchant Dashboard.

**Current state:** 7 pages, 9 shadcn components, pink color scheme, top-bar-only layout, no skeletons/toasts/breadcrumbs.
**Target state:** Collapsible sidebar layout, neutral gray palette with blue accent, 20+ shadcn components, loading skeletons, toast notifications, React Hook Form + Zod forms, mobile responsive.

---

## Wave 1: Foundation (Color Tokens + New Components)

### 1a. Recolor — Neutral gray + blue accent

Update `src/app/globals.css` with new token values:

| Token | Value | Hex | Purpose |
|-------|-------|-----|---------|
| `--primary` | `oklch(0.54 0.19 260)` | `#3b82f6` | Blue accent (buttons, links, focus) |
| `--primary-foreground` | `1 0 0` | `#ffffff` | White on primary |
| `--secondary` | `oklch(0.965 0 0)` | `#f5f5f5` | Light gray surfaces |
| `--secondary-foreground` | `oklch(0.205 0 0)` | `#171717` | Dark text on secondary |
| `--accent` | `oklch(0.965 0 0)` | `#f5f5f5` | Hover states, muted bg |
| `--accent-foreground` | `oklch(0.205 0 0)` | `#171717` | Text on accent |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `#ef4444` | Delete/danger |
| `--background` | `oklch(0.985 0 0)` | `#fafafa` | Page background |
| `--card` | `oklch(1 0 0)` | `#ffffff` | Card surfaces |
| `--muted` | `oklch(0.965 0 0)` | `#f5f5f5` | Muted text bg |
| `--muted-foreground` | `oklch(0.45 0 0)` | `#737373` | Muted text |
| `--border` | `oklch(0.92 0 0)` | `#e5e5e5` | Borders |
| `--ring` | `oklch(0.54 0.19 260)` | `#3b82f6` | Focus ring |

Update sidebar tokens to match.

### 1b. Install missing shadcn components

```bash
npx shadcn add dropdown-menu tooltip skeleton tabs sheet pagination alert-dialog textarea switch avatar breadcrumb sonner
```

### 1c. Install React Hook Form + Zod

```bash
npm install react-hook-form @hookform/resolvers zod
```

---

## Wave 2: Layout System

### 2a. Collapsible Sidebar (`src/components/layout/app-sidebar.tsx`)

- `AppSidebar` component using shadcn `Sheet` for mobile, custom sidebar for desktop
- Left sidebar with: logo, nav links (Dashboard, Products, Inventory placeholder), user info at bottom
- Collapsible via state (expanded ~240px → collapsed ~64px icons-only)
- Active link highlighting using `usePathname()`
- Lucide icons: `LayoutDashboard`, `Package`, `Warehouse`, `Settings`
- On mobile: slide-out Sheet triggered by hamburger in header

### 2b. Top Header (`src/components/layout/app-header.tsx`)

- Hamburger button (mobile only, toggles sidebar Sheet)
- Breadcrumb navigation (shadcn Breadcrumb component)
- Right side: Search input placeholder, notification bell icon, user avatar dropdown
- Dropdown menu: Profile, Settings, Logout

### 2c. App Shell (`src/components/layout/app-shell.tsx`)

- Wraps sidebar + header + main content area
- Main content: `flex-1 overflow-auto` with `<main className="p-6 lg:p-8">`
- Responsive: sidebar hidden on mobile, visible on lg+

### 2d. Update Root Layout (`src/app/layout.tsx`)

- Update metadata: title "Retail POS", description
- Keep existing fonts (Inter, Roboto)
- Body: `h-full bg-background`

### 2e. New Admin Layout (`src/app/admin/layout.tsx`)

- Replace current top-bar-only layout with `AppShell` wrapper
- Remove duplicate auth checks (keep only layout-level)
- Children render inside `AppShell`

### 2f. Update Login Page

- Keep centered card design but polish: proper spacing, subtle shadow, brand logo
- Use `Card`, `CardContent`, `CardHeader`, `CardTitle`

---

## Wave 3: Admin Dashboard Redesign

### `src/app/admin/page.tsx`

- **Page header:** "Dashboard" title + "Welcome back, {name}" description
- **Stat cards row (4 cards):**
  - Total Products (with Package icon)
  - Active Products (with CheckCircle icon)
  - Low Stock Items (with AlertTriangle icon)
  - Categories (with Tag icon)
- Each stat card: icon, label, value, subtle background color
- **Recent products table:** Last 5 products with compact columns
- **Quick actions card:** Links to Products, (future) Inventory
- Loading state: skeleton placeholders for stat cards and table

---

## Wave 4: Products List Redesign

### `src/app/admin/products/page.tsx`

- **Page header:** "Products" title + description "Manage your product catalog"
- **Primary action button:** "Add Product" (top-right)
- **Filter toolbar:** Search input + Category filter dropdown
- **Product table:**
  - Sticky header
  - Columns: Checkbox, Name, SKU, Category, Price, Stock, Status (Badge), Actions (DropdownMenu)
  - Actions dropdown: Edit, Deactivate/Activate, View (icons + labels)
  - Hover effect on rows
  - Status badges: Active=green, Inactive=gray, Low Stock=amber, Out of Stock=red
- **Pagination:** shadcn Pagination component (Previous/Next + page numbers)
- **Loading state:** Skeleton rows
- **Empty state:** Illustration + "No products found" + "Add your first product" CTA
- **Confirmation dialog:** AlertDialog for deactivate action

### Install shadcn pagination component for proper page navigation

---

## Wave 5: Product Forms Redesign

### `src/components/product-form.tsx`

- **React Hook Form + Zod** validation schema
- **Two-column layout on desktop**, one-column on mobile
- **Form sections with headings:** Basic Info, Pricing, Inventory, Details
- **Proper validation messages** below each field
- **Helpful placeholders** for all inputs
- **Active toggle:** Switch component instead of checkbox
- **Submit button:** Primary with loading spinner
- **Cancel button:** Outline variant

### Update `src/app/admin/products/new/page.tsx` and `.../[id]/edit/page.tsx`

- Simplified wrappers using redesigned ProductForm
- Toast notification on success/error
- Redirect to products list after success

---

## Wave 6: POS Terminal Redesign

### `src/app/pos/page.tsx`

- Clean layout with sidebar (simpler version for cashiers)
- **Page header:** "POS Terminal" + session info
- Keep as functional stub but with proper styling
- Logout in sidebar
- Placeholder cards for future: product grid, cart, checkout

---

## Wave 7: Polish & Animations

- Add `transition-all duration-200` to all interactive elements
- Button hover: `hover:bg-primary/90` transitions
- Card hover: subtle shadow increase
- Dropdown/Sheet: smooth open/close via `tw-animate-css`
- Focus visible rings on all interactive elements
- Consistent `gap-6` spacing between page sections
- `gap-4` between cards in grids

---

## Files to Create (new)

| File | Purpose |
|------|---------|
| `src/components/layout/app-sidebar.tsx` | Collapsible sidebar |
| `src/components/layout/app-header.tsx` | Top header with breadcrumb + user menu |
| `src/components/layout/app-shell.tsx` | Layout wrapper |
| `src/components/layout/nav-links.tsx` | Sidebar navigation links config |

## Files to Modify (existing)

| File | Changes |
|------|---------|
| `src/app/globals.css` | New color tokens (neutral gray + blue) |
| `src/app/layout.tsx` | Update metadata, fonts |
| `src/app/admin/layout.tsx` | Replace with AppShell layout |
| `src/app/admin/page.tsx` | Stat cards + recent products dashboard |
| `src/app/admin/products/page.tsx` | Table redesign with dropdowns, skeleton, empty state |
| `src/app/admin/products/new/page.tsx` | React Hook Form + Zod, toast |
| `src/app/admin/products/[id]/edit/page.tsx` | React Hook Form + Zod, toast |
| `src/components/product-form.tsx` | Full rewrite with RHF + Zod, two-column |
| `src/app/login/page.tsx` | Polish styling |
| `src/app/pos/page.tsx` | Restyle with sidebar shell |

## shadcn Components to Install

```
dropdown-menu tooltip skeleton tabs sheet pagination
alert-dialog textarea switch avatar breadcrumb sonner
```

## NPM Packages to Install

```
react-hook-form @hookform/resolvers zod
```

---

## Implementation Order

1. Wave 1: Color tokens + install components + packages
2. Wave 2: Layout system (sidebar, header, shell)
3. Wave 3: Dashboard redesign
4. Wave 4: Products list redesign
5. Wave 5: Product forms redesign
6. Wave 6: POS terminal redesign
7. Wave 7: Polish + animations

Each wave is independently testable — run `npm run dev` after each wave to verify.
