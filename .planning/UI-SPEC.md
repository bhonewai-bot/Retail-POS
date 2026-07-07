---
slug: ui-foundation
status: draft
shadcn_initialized: true
preset: b1fyMgCu0e (base-vega, zinc, lucide, inter+roboto)
created: 2026-07-07
---

# UI Foundation — Design Contract

> Shared UI component library, layout shells, and page templates for the entire Retail POS application.
> This is not a roadmap phase. It establishes the visual and interaction contracts that all feature phases consume.

---

## Scope

This contract defines:
1. Shared shadcn components (installed once, used everywhere)
2. Admin layout shell and page templates
3. Cashier (POS) layout shell and page templates
4. Typography, spacing, and color tokens (shadcn zinc preset)
5. POS-specific UI patterns

Admin and cashier pages are visually distinct but share the same design system, component library, and token set.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn |
| Preset code | `b1fyMgCu0e` |
| Style | base-vega |
| Component library | Radix UI (via shadcn) |
| Icon library | lucide-react |
| Body font | Inter (`--font-sans`, via Next.js `next/font/google`) |
| Heading font | Roboto (`--font-heading`, via Next.js `next/font/google`) |
| CSS variable source | `src/app/globals.css` |
| Token output | oklch (zinc palette) |
| Component aliases | `@/components/ui/*`, `@/lib/utils` |

**shadcn components.json** exists at project root. All UI components are installed via `npx shadcn add <name>`.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | All blocks below | not required -- official registry |
| (none) | -- | -- |

No third-party registries. No safety vetting required.

---

## Shared Component Inventory

All components installed once under `src/components/ui/` and imported by both admin and cashier pages.

| Component | shadcn Block | Install | Primary Use |
|-----------|-------------|---------|-------------|
| Button | `button` | installed | All CTAs, navigation triggers, action buttons |
| Input | `input` | pending | Search fields, form text/number inputs |
| Table | `table` | pending | Product lists, inventory tables, transaction history |
| Badge | `badge` | pending | Stock status, order status, role indicators |
| Card | `card` | pending | Dashboard tiles, summary panels, content containers |
| Dialog | `dialog` | pending | Confirmations, adjustment forms, detail modals |
| Select | `select` | pending | Dropdown filters, category pickers, reason selectors |
| Label | `label` | pending | Form field labels |
| Separator | `separator` | pending | Visual dividers between sections |

**Install command (single call):**
```bash
npx shadcn add button input table badge card dialog select label separator
```

**Component alias mapping (from `components.json`):**
- `@/components/ui/button` -- Button
- `@/components/ui/input` -- Input
- `@/components/ui/table` -- Table, TableHeader, TableBody, TableRow, TableHead, TableCell
- `@/components/ui/badge` -- Badge
- `@/components/ui/card` -- Card, CardHeader, CardTitle, CardContent
- `@/components/ui/dialog` -- Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle
- `@/components/ui/select` -- Select, SelectTrigger, SelectContent, SelectItem
- `@/components/ui/label` -- Label
- `@/components/ui/separator` -- Separator

---

## Typography

| Role | Size | Weight | Line Height | Tailwind | Font |
|------|------|--------|-------------|----------|------|
| Meta | 12px | 400 (regular) | 1.4 | `text-xs` | Inter |
| Body | 16px | 400 (regular) | 1.5 | `text-base` | Inter |
| Heading | 20px | 600 (semibold) | 1.3 | `text-xl font-semibold` | Roboto |
| Display | 28px | 600 (semibold) | 1.2 | `text-3xl font-semibold` | Roboto |

**Usage rules:**
- Page titles: Display (28px, semibold, Roboto) -- one per page, top of content area
- Section headings: Heading (20px, semibold, Roboto)
- Table headers: Meta (12px, regular, Inter) -- uppercase, `text-muted-foreground`
- Form labels: Meta (12px, regular, Inter) -- normal case
- Body / paragraphs: Body (16px, regular, Inter)
- Meta / captions / status text: Meta (12px, regular, Inter), `text-muted-foreground`
- Table cell text: Body (16px, regular, Inter) -- default cell weight

---

## Spacing Scale

Declared values (multiples of 4 only):

| Token | Value | Tailwind Class | Usage |
|-------|-------|----------------|-------|
| xs | 4px | `p-1` / `gap-1` | Icon gaps, inline padding, badge inner padding |
| sm | 8px | `p-2` / `gap-2` | Compact element spacing, input vertical padding |
| md | 16px | `p-4` / `gap-4` | Default element spacing, table cell padding |
| lg | 24px | `p-6` / `gap-6` | Section padding, card internal spacing |
| xl | 32px | `p-8` / `gap-8` | Layout gaps, main content area padding |
| 2xl | 48px | `p-12` | Major section breaks |
| 3xl | 64px | `p-16` | Page-level spacing |

**Exceptions:**
- Table row height: 48px minimum (via `py-3` on cells)
- Icon-only touch targets: 40px minimum (`min-h-10 min-w-10`)
- Cashier product cards: 80px minimum height (POS grid items)

---

## Color

All values are CSS variables from the zinc preset (`src/app/globals.css`).

**60/30/10 Split:**

| Role | Percentage | CSS Variable | oklch Value | Tailwind Token | Usage |
|------|-----------|-------------|-------------|----------------|-------|
| Dominant | 60% | `--background` | `oklch(1 0 0)` | `bg-background` | Page background, full-bleed canvas |
| Secondary | 30% | `--card` | `oklch(1 0 0)` | `bg-card` | Card surfaces, table containers, sidebars |
| Accent | 10% | `--primary` | `oklch(0.21 0.006 285.885)` | `bg-primary` | Primary CTA buttons, active nav items, focus rings |

**Destructive (semantic, not part of 60/30/10):**

| CSS Variable | oklch Value | Tailwind Token | Usage |
|-------------|-------------|----------------|-------|
| `--destructive` | `oklch(0.577 0.245 27.325)` | `bg-destructive text-destructive-foreground` | Delete/deactivate confirmations, void transactions only |

**Card vs Background visual separation:**
`--background` and `--card` share `#ffffff` in light mode. Visual separation is achieved through:
- `shadow-sm` or `shadow` on card/table containers
- `border border-border` on table cells and input fields
- `rounded-lg` on card containers
Do not rely on color difference alone.

**Accent reserved for:**
- Primary CTA buttons (submit, confirm actions)
- Active navigation link highlight
- Focus ring outline on all interactive elements (`ring-primary`)

**Status badge colors (semantic, not accent):**

| Status | Condition | Badge Class | Meaning |
|--------|-----------|-------------|---------|
| Healthy | stock > 10 | `bg-green-100 text-green-800` | No action needed |
| Low | stock 1-10 | `bg-amber-100 text-amber-800` | Needs attention |
| Out of stock | stock = 0 | `bg-red-100 text-red-800` | Immediate action required |
| Active | entity is active | `bg-green-100 text-green-800` | Enabled / live |
| Inactive | entity is inactive | `bg-red-100 text-red-800` | Disabled / soft-deleted |
| Pending | order in progress | `bg-amber-100 text-amber-800` | Awaiting completion |
| Completed | order finished | `bg-green-100 text-green-800` | Successfully processed |

---

## Focal Point

The stock status and order status badges are the primary visual anchors across all list views. They draw the eye to items requiring attention (low stock, pending orders) through color contrast (amber/red against white table backgrounds). Tables are sorted by priority (lowest stock first, oldest pending first) so these badges appear at the top.

---

## Admin Layout Shell

**Route prefix:** `/admin/*`
**Layout file:** `src/app/admin/layout.tsx`

```
┌──────────────────────────────────────────────────────────────┐
│  Retail POS    Products  Inventory  Transactions   [User] [Logout]  │  ← top nav bar
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  max-w-6xl mx-auto p-8                                      │
│  {children}                                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Nav bar tokens:**
- Background: `bg-card` with `shadow` (card surface + shadow for elevation)
- Height: `h-16`
- Content: `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`
- Logo/brand: `text-xl font-semibold text-foreground` (Heading tier, Roboto)
- Nav links: `text-sm text-muted-foreground hover:text-foreground` (Body size, regular weight)
- Active nav link: `text-foreground font-medium` with `border-b-2 border-primary` underline
- User badge: `text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full`
- Logout: `text-sm text-destructive hover:text-destructive/80`

**Admin pages:**

| Route | Page | Purpose |
|-------|------|---------|
| `/admin` | Dashboard | Overview tiles, quick actions |
| `/admin/products` | Products | Product list with search, pagination |
| `/admin/products/new` | New Product | Product creation form |
| `/admin/products/[id]/edit` | Edit Product | Product edit form |
| `/admin/inventory` | Inventory | Stock levels, low-stock alerts |
| `/admin/transactions` | Transactions | Transaction history, filters |
| `/admin/settings` | Settings | Store config, user management (future) |

---

## Cashier (POS) Layout Shell

**Route prefix:** `/pos/*`
**Layout file:** `src/app/pos/layout.tsx` (to be created)

The POS terminal uses a **split-panel layout** -- product catalog on the left, cart on the right. This is the standard POS UI pattern.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Retail POS Terminal              [Cashier Name]  [Manager] [Logout] │  ← top bar
├────────────────────────────────────┬────────────────────────────────┤
│                                    │                                │
│  [Search products by name/SKU...]  │  Cart                          │
│                                    │                                │
│  ┌──────┐ ┌──────┐ ┌──────┐      │  ┌──────────────────────────┐  │
│  │Prod 1│ │Prod 2│ │Prod 3│      │  │ Item    Qty  Price  Total │  │
│  │$12.99│ │$5.49 │ │$8.00 │      │  │ Widget   2   $12.99  $25.98│  │
│  └──────┘ └──────┘ └──────┘      │  │ Gadget   1    $5.49   $5.49│  │
│  ┌──────┐ ┌──────┐ ┌──────┐      │  ├──────────────────────────┤  │
│  │Prod 4│ │Prod 5│ │Prod 6│      │  │ Subtotal        $31.47   │  │
│  │$3.25 │ │$15.00│ │$7.50 │      │  │ Tax (8%)         $2.52   │  │
│  └──────┘ └──────┘ └──────┘      │  │ Total           $33.99   │  │
│  ...                              │  ├──────────────────────────┤  │
│                                    │  │ [  Pay  ]   [ Clear Cart ] │  │
│                                    │  └──────────────────────────┘  │
├────────────────────────────────────┴────────────────────────────────┤
│  Pagination: Previous  Page 1 of 10  Next                          │
└─────────────────────────────────────────────────────────────────────┘
```

**POS nav bar tokens:**
- Background: `bg-card` with `shadow`
- Height: `h-14` (slightly shorter than admin -- POS is full-screen focused)
- Content: full-width, `px-4`
- Logo: `text-lg font-semibold text-foreground`
- Cashier name: `text-sm text-muted-foreground`
- Logout: `text-sm text-destructive hover:text-destructive/80`

**Split panel tokens:**
- Left panel (catalog): `flex-1 overflow-y-auto`
- Right panel (cart): `w-96 bg-card border-l border-border flex flex-col`
- Divider: `border-l border-border` (no separator component needed)

**POS pages:**

| Route | Page | Purpose |
|-------|------|---------|
| `/pos` | Terminal | Main checkout interface (split-panel) |
| `/pos/transactions` | My Transactions | Cashier's own transaction history (future) |

---

## Page Templates

### List Page Template

Used by: Products, Inventory, Transactions

```
┌─────────────────────────────────────────────┐
│  Page Title                     [CTA Button]│  ← flex justify-between items-center mb-6
├─────────────────────────────────────────────┤
│  [Search input...]                          │  ← full width, mb-6
├─────────────────────────────────────────────┤
│  [Filter toggle]  Sort: [dropdown]          │  ← optional filter bar, mb-4
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │  Table (shadcn)                     │    │  ← bg-card rounded-lg shadow overflow-hidden
│  │  Header: bg-muted text-xs uppercase │    │
│  │  Rows: hover:bg-muted/50            │    │
│  └─────────────────────────────────────┘    │
├─────────────────────────────────────────────┤
│  Previous   Page X of Y   Next             │  ← flex justify-between items-center mt-4
└─────────────────────────────────────────────┘
```

**List page tokens:**
- Wrapper: no extra container needed (admin layout provides `max-w-6xl mx-auto p-8`)
- Table container: `bg-card rounded-lg shadow overflow-hidden`
- Table header row: `bg-muted`
- Table header cell: `text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3 text-left`
- Table body cell: `px-4 py-3 text-base text-foreground`
- Table row hover: `hover:bg-muted/50`
- Table row border: `border-b border-border` (last row: no border)
- Empty state: centered, `py-12 text-muted-foreground text-base`
- Pagination: `flex justify-between items-center mt-4`
- Pagination buttons: shadcn Button variant `outline`, size `sm`

### Form Page Template

Used by: New Product, Edit Product, Adjustment Forms

```
┌─────────────────────────────────────────────┐
│  Page Title                                 │  ← Display tier, mb-6
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │  Card (shadcn)                      │    │  ← bg-card rounded-lg shadow p-6
│  │                                     │    │
│  │  Label: text-xs text-muted-foreground│   │
│  │  Input: full width, mb-4            │    │
│  │                                     │    │
│  │  [Cancel]          [Submit Button]  │    │  ← flex justify-end gap-3 mt-6
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

**Form page tokens:**
- Card: `bg-card rounded-lg shadow p-6`
- Field wrapper: `mb-4` (each field group)
- Label: shadcn Label component, `text-xs font-medium text-muted-foreground mb-1.5 block`
- Input: shadcn Input component, full width
- Error text: `text-xs text-destructive mt-1`
- Button row: `flex justify-end gap-3 mt-6`
- Cancel: shadcn Button variant `outline`
- Submit: shadcn Button variant `default` (primary)

### Dashboard Tile Template

Used by: Admin dashboard summary tiles

```
┌─────────────────────┐
│  Tile Title         │  ← text-xs text-muted-foreground uppercase
│  42                 │  ← text-3xl font-semibold text-foreground
│  Products           │  ← text-sm text-muted-foreground
└─────────────────────┘
```

**Tile tokens:**
- Container: `bg-card rounded-lg shadow p-6`
- Title: `text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2`
- Value: `text-3xl font-semibold text-foreground mb-1`
- Subtitle: `text-sm text-muted-foreground`

---

## Interaction States

| State | Visual Treatment |
|-------|-----------------|
| Loading | Skeleton rows: `animate-pulse bg-muted rounded` placeholders |
| Empty (no data) | Full-page empty state centered in content area |
| Empty (no filter results) | Single table row: "No results found." spanning all columns |
| Error (fetch failed) | Inline error banner: `border border-destructive bg-destructive/10 text-destructive rounded-lg p-4` |
| Success (action saved) | Toast notification (bottom-right): green check icon + success message |

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Empty state heading | `No data yet` |
| Empty state body | `Add items to get started.` |
| Error state heading | `Something went wrong` |
| Error state body | `Check your connection and try again.` |
| Table "no results" row | `No results found.` |
| Loading text | `Loading...` |
| POS: Cart empty | `Cart is empty` |
| POS: Cart empty hint | `Search for a product to add it to the cart.` |
| POS: Pay button | `Pay` |
| POS: Clear cart | `Clear Cart` |
| Destructive confirm title | `Are you sure?` |
| Destructive confirm body | `This action cannot be undone.` |

---

## Design Tokens Summary (executor reference)

| Token | CSS Variable | Tailwind Class |
|-------|-------------|----------------|
| Page background | `--background` | `bg-background` |
| Card surface | `--card` | `bg-card` |
| Primary text | `--foreground` | `text-foreground` |
| Secondary text | `--muted-foreground` | `text-muted-foreground` |
| Muted surface | `--muted` | `bg-muted` |
| Primary button bg | `--primary` | `bg-primary` |
| Primary button text | `--primary-foreground` | `text-primary-foreground` |
| Destructive | `--destructive` | `bg-destructive text-destructive-foreground` |
| Input border | `--border` | `border-border` |
| Focus ring | `--ring` | `ring-ring` |
| Badge: healthy/active | (manual) | `bg-green-100 text-green-800` |
| Badge: low/pending | (manual) | `bg-amber-100 text-amber-800` |
| Badge: out/inactive | (manual) | `bg-red-100 text-red-800` |

---

## Transition Compatibility

Phase 1-2 pages use raw Tailwind classes (`bg-gray-50`, `bg-blue-600`, `text-gray-900`). This foundation establishes the shadcn token system (`bg-background`, `bg-primary`, `text-foreground`) for all new pages. Both systems coexist:
- **New pages** (Phase 3+): use shadcn tokens exclusively
- **Existing pages** (Phases 1-2): can be migrated in a future cleanup pass, but are not blocking

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
