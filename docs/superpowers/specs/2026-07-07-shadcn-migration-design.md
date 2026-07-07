# shadcn Migration Design

## Goal

Migrate all 7 existing pages from raw Tailwind CSS to shadcn components and design tokens. Establish a consistent pink + violet color scheme and extract shared components.

## Color Scheme: Pink + Violet

| Role | Token | oklch | Hex | Tailwind |
|------|-------|-------|-----|----------|
| Primary | `--primary` | `0.69 0.27 330` | `#ec4899` | `bg-primary` |
| Primary fg | `--primary-foreground` | `1 0 0` | `#ffffff` | `text-primary-foreground` |
| Secondary | `--secondary` | `0.55 0.24 270` | `#8b5cf6` | `bg-secondary` |
| Secondary fg | `--secondary-foreground` | `0.98 0 0` | `#fafafa` | `text-secondary-foreground` |
| Accent | `--accent` | `0.63 0.27 310` | `#d946ef` | `bg-accent` |
| Accent fg | `--accent-foreground` | `0.98 0 0` | `#fafafa` | `text-accent-foreground` |
| Destructive | `--destructive` | `0.63 0.24 25` | `#ef4444` | `bg-destructive` |
| Background | `--background` | `0.985 0 0` | `#fafafa` | `bg-background` |
| Card | `--card` | `1 0 0` | `#ffffff` | `bg-card` |
| Muted | `--muted` | `0.967 0 0` | `#f5f5f5` | `bg-muted` |
| Border | `--border` | `0.92 0 0` | `#e5e5e5` | `border-border` |

## Components to Install

```bash
npx shadcn add input label table badge card dialog select separator
```

## Migration Order

1. `globals.css` — update color tokens to pink + violet scheme
2. `src/app/page.tsx` (Home)
3. `src/app/login/page.tsx` (Login)
4. `src/app/pos/page.tsx` (POS Terminal)
5. `src/app/admin/page.tsx` (Admin Dashboard)
6. `src/app/admin/layout.tsx` (Admin Nav)
7. `src/app/admin/products/page.tsx` (Products List)
8. `src/app/admin/products/new/page.tsx` (New Product) → extract `ProductForm`
9. `src/app/admin/products/[id]/edit/page.tsx` (Edit Product) → thin wrapper

## Color Mapping

| Raw Tailwind | shadcn token |
|-------------|-------------|
| `bg-blue-600 text-white` | `bg-primary text-primary-foreground` |
| `bg-red-600 text-white` | `bg-destructive text-destructive-foreground` |
| `bg-gray-50` (page) | `bg-background` |
| `bg-white` (cards) | `bg-card` |
| `text-gray-900` | `text-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `border-gray-300` | `border-border` |
| `focus:ring-blue-500` | `focus:ring-ring` |

## Shared Components

- Extract `ProductForm` component from New/Edit Product pages
- Both pages become thin wrappers (~50 lines each)
