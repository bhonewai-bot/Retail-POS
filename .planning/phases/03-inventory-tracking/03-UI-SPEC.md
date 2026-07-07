---
phase: 3
slug: inventory-tracking
status: draft
shadcn_initialized: true
preset: b1fyMgCu0e (base-vega, zinc, lucide, inter+roboto)
created: 2026-07-07
---

# Phase 3 — Inventory Tracking UI Design Contract

> Visual and interaction contract for the inventory tracking admin UI.
> Requirements covered: INV-01, INV-02, INV-03

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn |
| Preset code | `b1fyMgCu0e` |
| Style | base-vega |
| Component library | Radix UI (via shadcn) |
| Icon library | lucide-react |
| Body font | Inter (via Next.js `next/font/google`) |
| Heading font | Roboto (via Next.js `next/font/google`) |
| CSS variable source | `src/app/globals.css` |
| Token output | oklch (zinc palette) |
| Component aliases | `@/components/ui/*`, `@/lib/utils` |

**shadcn components.json** exists at project root. All new UI components must be installed via `npx shadcn add <name>`.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | `button`, `input`, `table`, `badge`, `dialog`, `label`, `select` | not required — official registry |
| (none) | — | — |

No third-party registries. No safety vetting required.

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Tailwind Class | Usage |
|-------|-------|----------------|-------|
| xs | 4px | `p-1` / `gap-1` | Icon gaps, inline padding, badge inner padding |
| sm | 8px | `p-2` / `gap-2` | Compact element spacing, input vertical padding |
| md | 16px | `p-4` / `gap-4` | Default element spacing, table cell padding |
| lg | 24px | `p-6` / `gap-6` | Section padding, card internal spacing |
| xl | 32px | `p-8` / `gap-8` | Layout gaps, main content area padding |
| 2xl | 48px | `p-12` | Major section breaks (not expected this phase) |
| 3xl | 64px | `p-16` | Page-level spacing (not expected this phase) |

Exceptions:
- Table row height: 48px minimum (achieved via `py-3` on table cells, not a spacing token)
- Icon-only touch targets: 40px minimum (`min-h-10 min-w-10` for any icon button)

---

## Typography

| Role | Size | Weight | Line Height | Tailwind | Font |
|------|------|--------|-------------|----------|------|
| Body | 16px | 400 (regular) | 1.5 | `text-base` | Inter |
| Label | 14px | 500 (medium) | 1.4 | `text-sm` | Inter |
| Heading | 20px | 600 (semibold) | 1.3 | `text-xl font-semibold` | Roboto |
| Display | 28px | 700 (bold) | 1.2 | `text-3xl font-bold` | Roboto |

**Usage rules:**
- Page titles: Display (28px, bold, Roboto) — one per page, top of content area
- Section headings: Heading (20px, semibold, Roboto)
- Table headers: Label (14px, medium, Inter) — uppercase, `text-muted-foreground`
- Form labels: Label (14px, medium, Inter) — normal case
- Body / paragraphs: Body (16px, regular, Inter)
- Meta / captions: 12px (`text-xs`), 400 weight, `text-muted-foreground`
- Table cell text: Body (16px, regular, Inter) — default cell weight

---

## Color

All values are CSS variables from the zinc preset (`globals.css :root`).

| Role | CSS Variable | oklch Value | Hex Equivalent | Tailwind Token | Usage |
|------|-------------|-------------|----------------|----------------|-------|
| Dominant (60%) | `--background` | `oklch(1 0 0)` | `#ffffff` | `bg-background` | Page background |
| Secondary (30%) | `--card` | `oklch(1 0 0)` | `#ffffff` | `bg-card` | Card surfaces, table containers |
| Accent (10%) | `--primary` | `oklch(0.21 0.006 285.885)` | `~#27272a` | `bg-primary` | Primary buttons, active nav item, focus rings |
| Destructive | `--destructive` | `oklch(0.577 0.245 27.325)` | `~#dc2626` | `bg-destructive text-destructive-foreground` | Delete/deactivate confirmation buttons only |

**Accent reserved for:**
- "Record Adjustment" submit button (primary CTA)
- Focus ring outline on all form inputs (`ring-primary`)
- Active nav link underline or background

**Stock-level semantic colors (status badges, NOT accent):**

| Stock Level | Condition | Badge Class | Meaning |
|-------------|-----------|-------------|---------|
| Healthy | stock > 10 | `bg-green-100 text-green-800` | No action needed |
| Low | stock 1-10 | `bg-amber-100 text-amber-800` | Needs attention soon |
| Out of stock | stock = 0 | `bg-red-100 text-red-800` | Immediate action required |

**Transition compatibility note:** Phase 1-2 pages use `bg-gray-50` for page background and `bg-blue-600` for CTA buttons. For Phase 3, use the shadcn tokens (`bg-background`, `bg-card`, `text-primary`) so new pages follow the design system. Existing pages can be migrated in a future cleanup pass.

**Background token mapping for admin pages:**
- Admin page wrapper: `bg-background` (zinc-50 white in light mode)
- Card / table wrapper: `bg-card` (white)
- Input backgrounds: `bg-input` (zinc-200 equivalent)
- Text primary: `text-foreground` (zinc-900)
- Text secondary: `text-muted-foreground` (zinc-500)

---

## Component Inventory

Install via `npx shadcn add <name>` before building:

| Component | Source | Where Used in Phase 3 |
|-----------|--------|----------------------|
| `button` | shadcn (already installed) | CTA buttons, form submit, cancel |
| `input` | shadcn | Search field, quantity input |
| `table` | shadcn | Inventory stock table |
| `badge` | shadcn | Stock-level status badges (healthy/low/out) |
| `dialog` | shadcn | "Record Adjustment" modal form |
| `label` | shadcn | Form field labels (quantity, reason, notes) |
| `select` | shadcn | Adjustment reason dropdown |

**Install command (single call):**
```bash
npx shadcn add button input table badge dialog label select
```

---

## Page Layout Contract

**Route:** `/admin/inventory`

**Wrapper:** All admin pages use the existing `src/app/admin/layout.tsx` — top nav bar (white, shadow, max-w-6xl), centered content area (`max-w-6xl mx-auto p-8`).

**Inventory page structure (top to bottom):**

```
┌─────────────────────────────────────────────────┐
│  Inventory  [Record Adjustment]   (flex row)    │  ← page header
├─────────────────────────────────────────────────┤
│  [Show Low Stock Only] toggle    Sort: [▼]      │  ← filter bar
├─────────────────────────────────────────────────┤
│  Product | SKU | Category | Stock | Status       │  ← table header
│  Widget  | W-001| Gadgets | 42    | [Healthy]    │
│  Gadget  | G-012| Tools   | 0     | [Out of Stock]│
│  ...      |      |         |       |              │
├─────────────────────────────────────────────────┤
│  Previous  Page 1 of 5  Next                     │  ← pagination (20 per page)
└─────────────────────────────────────────────────┘
```

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Page title | `Inventory` |
| Primary CTA | `Record Adjustment` |
| Empty state heading | `No inventory data yet` |
| Empty state body | `Add products first, then inventory levels will appear here.` |
| Error state | `Something went wrong loading inventory.` + `Check your connection and try again.` |
| Destructive confirmation | `Record Stock Adjustment`: `This will change the stock level for {product.name}. Enter the new quantity and a reason below.` |
| Low-stock filter label | `Show Low Stock Only` |
| Stock zero label | `Out of Stock` |
| Stock low label | `Low Stock` |
| Stock healthy label | `Healthy` |
| Table "no results" row | `No products match your filter.` |
| Adjustment dialog title | `Record Adjustment` |
| Adjustment dialog description | `Update stock level for {product.name}` |
| Quantity label | `New Quantity` |
| Reason label | `Reason` |
| Notes label | `Notes (optional)` |
| Reason options | `Stock Receipt`, `Damaged`, `Count Adjustment`, `Return`, `Other` |
| Submit button | `Save Adjustment` |
| Cancel button | `Cancel` |
| Success toast | `Stock updated successfully` |

---

## Interaction Contracts

### Stock Table

- **Load state:** Show a skeleton/placeholder row pattern (3-5 rows) while fetching. Use a `div` with `animate-pulse bg-muted rounded` for each cell.
- **Sort:** Default sort by stock ascending (lowest first) so low-stock items are visible immediately.
- **Pagination:** 20 items per page (matches product list pattern from Phase 2).
- **Row hover:** `hover:bg-muted/50` (subtle background shift).

### Low-Stock Filter Toggle

- **Component:** A toggle/checkbox styled as a pill button.
- **Unchecked:** Shows all products.
- **Checked:** Filters table to only show products where `stock <= LOW_STOCK_THRESHOLD`.
- **Threshold:** 10 units (constant, not user-configurable in this phase).

### Record Adjustment Dialog (Modal)

- **Trigger:** "Record Adjustment" button in page header.
- **Dialog opens with:** Pre-filled product selector (searchable `<select>` or combobox) + quantity input + reason dropdown + notes textarea.
- **Quantity input:** Number input, `min="0"`, placeholder `"Enter new quantity"`.
- **Reason select:** Dropdown with 5 options: Stock Receipt, Damaged, Count Adjustment, Return, Other.
- **Notes field:** Optional textarea, max 255 characters, placeholder `"Add a note..."`.
- **Submit:** `POST /api/inventory/adjust` with `{ productId, newQuantity, reason, notes }`.
- **On success:** Close dialog, show toast `Stock updated successfully`, re-fetch table data.
- **On error:** Show inline error message below the form, keep dialog open.
- **Cancel:** Close dialog, discard form state.

### API Endpoints Required

| Method | Route | Purpose | Response |
|--------|-------|---------|----------|
| GET | `/api/inventory` | List all products with stock levels, supports `?lowStock=true` and `?page=N` | `{ products: [...], pagination }` |
| PUT | `/api/inventory/{productId}` | Update stock quantity for a product | `{ product: { id, stock } }` |

---

## Interaction States Inventory

| State | Visual Treatment |
|-------|-----------------|
| Loading | Skeleton rows: `animate-pulse bg-muted rounded` placeholders |
| Empty (no products at all) | Full-page empty state centered in content area |
| Empty (no filter results) | Single table row: "No products match your filter." spanning all columns |
| Error (fetch failed) | Inline error banner: red border, `destructive` text, "Try again" link |
| Success (adjustment saved) | Toast notification (bottom-right): green check + "Stock updated successfully" |
| Stock = 0 | Red badge: "Out of Stock" |
| Stock 1-10 | Amber badge: "Low Stock" |
| Stock > 10 | Green badge: "Healthy" |

---

## Design Tokens Summary (for executor reference)

| Token | CSS Variable | Tailwind Class |
|-------|-------------|----------------|
| Page background | `--background` | `bg-background` |
| Card surface | `--card` | `bg-card` |
| Primary text | `--foreground` | `text-foreground` |
| Secondary text | `--muted-foreground` | `text-muted-foreground` |
| Primary button bg | `--primary` | `bg-primary` |
| Primary button text | `--primary-foreground` | `text-primary-foreground` |
| Destructive button | `--destructive` | `bg-destructive text-destructive-foreground` |
| Input border | `--border` | `border-border` |
| Focus ring | `--ring` | `ring-ring` |
| Badge: healthy | (manual) | `bg-green-100 text-green-800` |
| Badge: low | (manual) | `bg-amber-100 text-amber-800` |
| Badge: out of stock | (manual) | `bg-red-100 text-red-800` |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
