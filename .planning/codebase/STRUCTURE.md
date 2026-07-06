# Codebase Structure

**Analysis Date:** 2026-07-06

## Directory Layout

```
retail-pos/
├── app/                      # Auto-generated Prisma client code
│   └── generated/
│       └── prisma/           # Type definitions, models, client
│           ├── client.ts
│           ├── models.ts
│           ├── enums.ts
│           └── models/       # Individual model types
│               ├── Category.ts
│               ├── Product.ts
│               ├── Customer.ts
│               ├── Order.ts
│               ├── OrderItem.ts
│               └── User.ts
│
├── src/                      # Application source code
│   └── app/                  # Next.js App Router pages
│       ├── layout.tsx        # Root layout with metadata
│       └── page.tsx          # Home page / POS interface
│
├── lib/                      # Shared utilities and services
│   └── prisma.ts             # Prisma client singleton
│
├── prisma/                   # Database schema and configuration
│   └── schema.prisma         # Data models, relations, indexes
│
├── scripts/                  # Development and utility scripts
│   └── test-database.ts      # Database connectivity tester
│
├── public/                   # Static assets served at root
│   ├── next.svg
│   ├── vercel.svg
│   ├── globe.svg
│   ├── window.svg
│   └── file.svg
│
├── .planning/                # Project planning and documentation
│   └── codebase/             # Codebase analysis documents
│
├── .next/                    # Next.js build output (generated)
├── node_modules/             # Dependencies (generated)
│
├── package.json              # Dependencies and scripts
├── package-lock.json         # Locked dependency versions
├── tsconfig.json             # TypeScript configuration
├── next.config.ts            # Next.js configuration
├── eslint.config.mjs         # ESLint linting rules
├── postcss.config.mjs        # PostCSS/Tailwind plugin config
├── prisma.config.ts          # Prisma CLI configuration
├── next-env.d.ts             # Next.js TypeScript declarations
├── .env                      # Environment variables (not committed)
├── .gitignore                # Git ignore rules
├── AGENTS.md                 # AI agent instructions
├── CLAUDE.md                 # Project instructions for Claude
└── README.md                 # Project documentation
```

## Directory Purposes

**`src/app/` (App Router):**
- Purpose: Next.js page-based routing and layouts
- Contains: Page components, layout files, potential API routes
- Key files: `src/app/page.tsx` (home), `src/app/layout.tsx` (root layout)

**`lib/`:**
- Purpose: Shared utilities, services, and singletons
- Contains: Database client instances, utility functions, helper modules
- Key files: `lib/prisma.ts` (Prisma client singleton)

**`prisma/`:**
- Purpose: Database schema definition and migrations
- Contains: Prisma schema files, migration history
- Key files: `prisma/schema.prisma` (data models)

**`app/generated/prisma/`:**
- Purpose: Auto-generated Prisma client code and types
- Contains: Type definitions, model classes, client utilities
- Key files: `app/generated/prisma/client.ts` (client), `app/generated/prisma/models/` (types)
- Generated: Yes (via `prisma generate`)
- Committed: Yes (for type safety)

**`scripts/`:**
- Purpose: Standalone development and utility scripts
- Contains: Database test scripts, migration helpers, utilities
- Key files: `scripts/test-database.ts`

**`public/`:**
- Purpose: Static assets served at application root
- Contains: SVG files, images, favicons
- Generated: No
- Committed: Yes

**`.planning/`:**
- Purpose: Project planning, architecture docs, codebase analysis
- Contains: Markdown documents for development reference
- Generated: Manually by codebase mapper agents
- Committed: Yes (for team reference)

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Main application page, home route
- `src/app/layout.tsx`: Root layout, wraps all pages

**Configuration:**
- `package.json`: Dependencies, npm scripts, project metadata
- `tsconfig.json`: TypeScript compiler options, path aliases
- `next.config.ts`: Next.js framework configuration
- `eslint.config.mjs`: Linting rules and code style enforcement
- `prisma.config.ts`: Prisma CLI settings and database URL

**Core Logic:**
- `lib/prisma.ts`: Database connection singleton (singleton pattern)
- `prisma/schema.prisma`: Complete data model (Category, Product, Customer, Order, OrderItem, User)

**Testing:**
- `scripts/test-database.ts`: Database connectivity and CRUD tests

## Naming Conventions

**Files:**
- React Components: PascalCase (`page.tsx`, `layout.tsx`)
- Utilities/Services: camelCase (`prisma.ts`)
- Scripts: kebab-case (`test-database.ts`)
- Config: kebab-case or lowercase (`eslint.config.mjs`, `next.config.ts`)

**Directories:**
- `src/app/`: Lowercase (Next.js convention)
- `lib/`: Lowercase
- `prisma/`: Lowercase
- `scripts/`: Lowercase

**Exports:**
- Default exports for React components and Prisma client
- Named exports for utilities and types

## Where to Add New Code

**New Page/Route:**
- Create: `src/app/{route-name}/page.tsx`
- Example: `src/app/dashboard/page.tsx` for `/dashboard` route
- Layout: `src/app/{route-name}/layout.tsx` (optional, for nested layouts)

**New API Route:**
- Create: `src/app/api/{endpoint}/route.ts`
- Example: `src/app/api/products/route.ts` for `/api/products`

**New Utility/Service:**
- Create: `lib/{utility-name}.ts`
- Example: `lib/calculations.ts` for POS calculations

**New React Component:**
- Create: `src/app/components/{component-name}.tsx`
- Example: `src/app/components/ProductCard.tsx`

**New Database Model:**
- Edit: `prisma/schema.prisma` (add model block)
- Run: `npx prisma db push` (apply schema changes)
- Run: `npx prisma generate` (regenerate client types)

**New Script:**
- Create: `scripts/{script-name}.ts`
- Add: Script command in `package.json` under `"scripts"`
- Example: `scripts/seed-database.ts`

**New Configuration:**
- Config files go in root directory
- Use kebab-case naming
- Import in `tsconfig.json` if needed

## Special Directories

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes (via `npm run build` or `npm run dev`)
- Committed: No (gitignored)

**`app/generated/prisma/`:**
- Purpose: Auto-generated Prisma client types and client code
- Generated: Yes (via `npx prisma generate`)
- Committed: Yes (required for TypeScript type safety)

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (via `npm install`)
- Committed: No (gitignored)

---

*Structure analysis: 2026-07-06*
