<!-- GSD:project-start source:PROJECT.md -->

## Project

**Retail POS**

A demo point-of-sale system for practicing full-stack development with Next.js, Prisma, and PostgreSQL. It simulates a retail environment for a small store (~200 products) with product management, inventory tracking, and checkout functionality.

**Core Value:** Build a working POS system that demonstrates full-stack development patterns — from database schema through API to UI — while learning authentication, inventory management, and transaction processing.

### Constraints

- **Tech stack**: Next.js + TypeScript + Tailwind + Prisma + PostgreSQL
- **Timeline**: 2 days for MVP, then iterate
- **Payment**: No real payment processing (simulated only)
- **Scale**: ~200 products, single store
- **Focus**: Authentication is main priority

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript 5 - All application code (`src/app/*.tsx`, `lib/*.ts`, `scripts/*.ts`)
- JavaScript (ES Modules) - Configuration files (`next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`)

## Runtime

- Node.js 18+ (minimum required by Next.js 16)
- Next.js 16.2.10 - App Router architecture
- npm (package-lock.json present)
- Lockfile version: 3

## Frameworks

- React 19.2.4 - UI library (`src/app/page.tsx`)
- Next.js 16.2.10 - Full-stack framework with App Router (`app/` directory)
- React DOM 19.2.4 - DOM rendering
- Tailwind CSS 4 - Utility-first CSS framework (`src/app/globals.css`)
- PostCSS 8 - CSS processing with `@tailwindcss/postcss` plugin (`postcss.config.mjs`)
- Prisma 7.8.0 - Type-safe ORM (`prisma/schema.prisma`)
- @prisma/adapter-pg 7.8.0 - PostgreSQL adapter (`lib/prisma.ts`)
- @prisma/client 7.8.0 - Prisma client (`app/generated/prisma/`)
- TypeScript 5 - Static type checking (`tsconfig.json`)
- ESLint 9 - Linting (`eslint.config.mjs`)
- eslint-config-next 16.2.10 - Next.js ESLint rules
- Next.js CLI - Dev server (`npm run dev`), Production build (`npm run build`)
- tsx 4.23.0 - TypeScript execution for scripts (`npm run db:test`)

## Key Dependencies

- `next` 16.2.10 - Core framework (App Router, API routes, SSR/SSG)
- `react` 19.2.4 - UI rendering engine
- `prisma` 7.8.0 - Database ORM and migrations
- `@prisma/adapter-pg` 7.8.0 - PostgreSQL connection adapter
- `dotenv` 17.4.2 - Environment variable loading
- `tailwindcss` 4 - Styling system
- `typescript` 5 - Type safety
- `tsx` 4.23.0 - Script execution
- `eslint` 9 - Code quality

## Configuration

- Location: `.env` file (uses `dotenv/config` import)
- Required: `DATABASE_URL` (PostgreSQL connection string)
- Format: `postgres://[user]:[password]@[host]:[port]/[database]?sslmode=require`
- `next.config.ts` - Next.js configuration (minimal, using defaults)
- `tsconfig.json` - TypeScript compilation settings
- `postcss.config.mjs` - PostCSS plugin configuration
- `eslint.config.mjs` - ESLint rules
- `prisma.config.ts` - Prisma configuration (schema path, migrations, datasource)
- `prisma/schema.prisma` - Database schema definition
- Output: `app/generated/prisma/` (Prisma client)
- Adapter: PostgreSQL via `@prisma/adapter-pg`

## Package Scripts

## Platform Requirements

- Node.js 18 or higher
- PostgreSQL database (local or remote)
- Network access to database host
- Node.js 18+ runtime
- PostgreSQL database with SSL support
- Environment variables configured via hosting platform
- Compatible with Vercel (based on README)
- TypeScript compilation
- Prisma client generation
- Next.js optimization

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- PascalCase for React components: `layout.tsx`, `page.tsx`
- camelCase for utility/helper files: `prisma.ts`
- kebab-case for configuration files: `postcss.config.mjs`
- Generated files follow directory convention: `app/generated/prisma/`
- camelCase for all functions: `testDatabase()`, `getRootLayout()`
- React component names use PascalCase: `RootLayout`, `Home`
- camelCase for variables and functions: `globalForPrisma`, `geistSans`
- UPPER_SNAKE_CASE for environment variables: `DATABASE_URL`, `NODE_ENV`
- Constants use camelCase: `prisma`, `adapter`
- PascalCase for types and interfaces: `Metadata`, `PrismaClient`
- Import types with explicit `type` keyword: `import type { Metadata } from "next"`

## Code Style

- No Prettier configuration detected
- ESLint with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- ESLint config: `eslint.config.mjs` (flat config format)
- Two-space indentation (default Next.js)
- Single quotes for strings
- Semicolons present
- ESLint 9 with flat config
- Next.js TypeScript and React best practices enforced
- Strict TypeScript mode enabled in `tsconfig.json`
- Strict mode enabled
- `noEmit: true` (build tool handles compilation)
- Module: ESNext with bundler resolution
- Path aliases: `@/*` maps to `./src/*`

## Import Organization

- `@/*` → `./src/*` (used in imports like `@/components/Button`)

## Error Handling

- Async/await with try-catch-finally blocks
- Console logging for development errors: `console.error("❌ Error:", error)`
- Process exit for critical failures: `process.exit(1)`
- Cleanup in finally blocks: `await prisma.$disconnect()`
- Prisma client initialization with error handling
- Use `upsert()` for idempotent operations
- Use `!` operator for non-null assertions when confident

## Comments

- Schema/model section headers: `// ─── Categories ────────────`
- Schema field comments: `// cash, card, mobile, etc.`
- Script step numbering: `// Test 1: Check connection`
- No excessive inline comments
- Use `//` for single-line comments
- Use `//` for section separators with dashes: `// ─── Section Name ───────`
- Emoji for test output feedback: `console.log("✅ Connected!")`

## Function Design

- Keep functions focused on single responsibility
- Extract database logic into separate modules (e.g., `lib/prisma.ts`)
- Destructure props in React components: `{ children }`
- Use type assertions for global state: `global as unknown as { prisma: PrismaClient }`
- React components return JSX directly
- Async functions return Promises
- Use explicit type annotations for complex returns

## Module Design

- Default exports for single-export modules: `export default prisma`
- Named exports for multiple exports: `export const metadata: Metadata`
- React components use default exports: `export default function RootLayout()`
- Not used in current codebase
- Direct imports preferred

## React/Next.js Patterns

- Functional components only (no class components)
- React 19 with App Router
- Server Components by default (unless `'use client'` specified)
- Props typed inline: `Readonly<{ children: React.ReactNode }>`
- Tailwind CSS 4 with PostCSS
- Dark mode support via `dark:` prefix
- CSS variables for theme: `:root { --background: #ffffff }`
- Use `className` for styling, not inline styles

## Database/ORM Patterns

- Singleton pattern for client: global caching in non-production
- Adapter pattern for PostgreSQL: `PrismaPg`
- Schema-driven: auto-generate client to `app/generated/prisma/`
- Model names: PascalCase (`Category`, `Product`, `Order`)
- Field names: camelCase (`createdAt`, `customerId`)
- Relations: use foreign key naming convention (`categoryId`)
- Prefer `upsert()` for idempotent insertions
- Use `include` for eager loading related data
- Use `@@index()` for performance optimization
- Cascade deletes for required relationships

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root Layout | HTML structure, metadata, fonts, global styling | `src/app/layout.tsx` |
| Home Page | Main application UI, entry point for POS interface | `src/app/page.tsx` |
| Prisma Client Singleton | Database connection management, connection pooling | `lib/prisma.ts` |
| Generated Prisma Client | Type-safe database queries, model definitions | `app/generated/prisma/client.ts` |
| Prisma Configuration | Database URL, migrations path, schema location | `prisma.config.ts` |
| Database Schema | Data models, relations, indexes | `prisma/schema.prisma` |
| Database Test | Utility script for verifying database connectivity | `scripts/test-database.ts` |

## Pattern Overview

- File-system based routing using `[src/app]` directory structure
- Server-side rendering with React Server Components (RSC) and Client Components
- Auto-generated Prisma client for type-safe database operations
- Singleton Prisma client pattern to prevent connection exhaustion in development
- PostgreSQL as primary database with Prisma adapter for connection pooling
- Modular data access layer isolated in `lib/` directory

## Layers

- Purpose: Render UI, handle user interactions
- Location: `src/app/`
- Contains: React components, page layouts, metadata
- Depends on: Next.js framework, React 19, Tailwind CSS
- Used by: Client (browser)
- Purpose: Provide type-safe database operations
- Location: `lib/prisma.ts` + `app/generated/prisma/`
- Contains: Prisma client instance, model types, generated client code
- Depends on: Prisma 7.8, PostgreSQL adapter
- Used by: Application components, scripts
- Purpose: Define data models and tool configuration
- Location: `prisma/` + `prisma.config.ts`
- Contains: Prisma schema, migrations, tool config
- Depends on: PostgreSQL, Prisma
- Used by: Prisma client, deployment scripts
- Purpose: Standalone scripts and tools
- Location: `scripts/`
- Contains: Database test scripts, utilities
- Depends on: Prisma client, dotenv
- Used by: Developers for testing, debugging

## Data Flow

### Primary Request Path (User Interaction)

### Database Operations Flow

- React Server Components: Server-side state, no client reactivity needed
- Client Components: Local React state via `useState`/`useReducer`
- Database: PostgreSQL is source of truth for all persistent data
- In-memory: Prisma client singleton for connection pooling

## Key Abstractions

- Purpose: Prevent multiple database connections in development
- Examples: `lib/prisma.ts`
- Pattern: Global variable caching + conditional global assignment based on NODE_ENV
- Purpose: Full TypeScript type inference for database operations
- Examples: `app/generated/prisma/client.ts`, `app/generated/prisma/models/`
- Pattern: Auto-generated types from Prisma schema with model classes
- Purpose: File-system based routing and page rendering
- Examples: `src/app/page.tsx`, `src/app/layout.tsx`
- Pattern: Export default components + metadata objects

## Entry Points

- Location: `src/app/page.tsx`
- Triggers: User navigates to `/` or app root URL
- Responsibilities: Main POS dashboard, future cashier interface
- Location: `src/app/layout.tsx`
- Triggers: All page loads (wraps all pages)
- Responsibilities: HTML document structure, global CSS, font loading, metadata
- Location: `scripts/test-database.ts`
- Triggers: `npm run db:test`
- Responsibilities: Verify database connectivity, test CRUD operations

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop; PostgreSQL connections managed by Prisma adapter pool
- **Global state:** Prisma client singleton cached globally in development (`lib/prisma.ts:8-14`)
- **Circular imports:** None detected - clean dependency hierarchy
- **Component architecture:** Server Components by default; use `"use client"` directive for interactive components
- **Database connections:** Limited by PostgreSQL connection pool size and Prisma adapter limits

## Anti-Patterns

### Creating New Prisma Client Instances Per Request

### Bypassing Prisma Client in Components

## Error Handling

- Database connection errors caught at Prisma client level
- Validation errors caught in server components before database calls
- Error boundaries for client component rendering errors (React Suspense)

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
