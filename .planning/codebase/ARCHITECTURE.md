# Architecture

**Analysis Date:** 2026-07-06

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Browser)                    │
│         React 19.2 + Tailwind CSS 4                         │
│         `[src/app/layout.tsx]` + `[src/app/page.tsx]`        │
└──────────────────┬──────────────────┬───────────────────────┘
                   │                  │
                   ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│               Next.js 16.2.10 (App Router)                  │
│         `[next.config.ts]` + `[src/app/*]`                   │
│         Server/Client Component Rendering                    │
└──────────────────┬──────────────────┬───────────────────────┘
                   │                  │
                   ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Access Layer                           │
│         Prisma 7.8 Client + PostgreSQL Adapter               │
│         `[lib/prisma.ts]` + `[app/generated/prisma/client.ts]`│
└──────────────────┬──────────────────┬───────────────────────┘
                   │                  │
                   ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (External)                  │
│         Schema: `[prisma/schema.prisma]`                     │
└─────────────────────────────────────────────────────────────┘
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

**Overall:** Next.js App Router Pattern (React Server Components)

**Key Characteristics:**
- File-system based routing using `[src/app]` directory structure
- Server-side rendering with React Server Components (RSC) and Client Components
- Auto-generated Prisma client for type-safe database operations
- Singleton Prisma client pattern to prevent connection exhaustion in development
- PostgreSQL as primary database with Prisma adapter for connection pooling
- Modular data access layer isolated in `lib/` directory

## Layers

**Presentation Layer:**
- Purpose: Render UI, handle user interactions
- Location: `src/app/`
- Contains: React components, page layouts, metadata
- Depends on: Next.js framework, React 19, Tailwind CSS
- Used by: Client (browser)

**Data Access Layer:**
- Purpose: Provide type-safe database operations
- Location: `lib/prisma.ts` + `app/generated/prisma/`
- Contains: Prisma client instance, model types, generated client code
- Depends on: Prisma 7.8, PostgreSQL adapter
- Used by: Application components, scripts

**Schema/Configuration Layer:**
- Purpose: Define data models and tool configuration
- Location: `prisma/` + `prisma.config.ts`
- Contains: Prisma schema, migrations, tool config
- Depends on: PostgreSQL, Prisma
- Used by: Prisma client, deployment scripts

**Utility Layer:**
- Purpose: Standalone scripts and tools
- Location: `scripts/`
- Contains: Database test scripts, utilities
- Depends on: Prisma client, dotenv
- Used by: Developers for testing, debugging

## Data Flow

### Primary Request Path (User Interaction)

1. User navigates to app
2. Next.js App Router routes request to `src/app/page.tsx`
3. Server Component renders layout with metadata (`src/app/layout.tsx`)
4. Page component loads, potentially fetching data from Prisma client
5. Data layer queries PostgreSQL via `lib/prisma.ts` singleton
6. Response rendered back to client with React hydration

### Database Operations Flow

1. Component or script needs data access
2. Import Prisma client: `import prisma from "@/lib/prisma"`
3. Execute typed query: `prisma.product.findMany()`
4. Query sent to PostgreSQL via `PrismaPg` adapter with connection string
5. Response returned with full type safety
6. Client connection reused in development (singleton pattern)

**State Management:**
- React Server Components: Server-side state, no client reactivity needed
- Client Components: Local React state via `useState`/`useReducer`
- Database: PostgreSQL is source of truth for all persistent data
- In-memory: Prisma client singleton for connection pooling

## Key Abstractions

**Prisma Client Singleton:**
- Purpose: Prevent multiple database connections in development
- Examples: `lib/prisma.ts`
- Pattern: Global variable caching + conditional global assignment based on NODE_ENV

**Type-Safe ORM:**
- Purpose: Full TypeScript type inference for database operations
- Examples: `app/generated/prisma/client.ts`, `app/generated/prisma/models/`
- Pattern: Auto-generated types from Prisma schema with model classes

**App Router Pages:**
- Purpose: File-system based routing and page rendering
- Examples: `src/app/page.tsx`, `src/app/layout.tsx`
- Pattern: Export default components + metadata objects

## Entry Points

**Home Page (POS Interface):**
- Location: `src/app/page.tsx`
- Triggers: User navigates to `/` or app root URL
- Responsibilities: Main POS dashboard, future cashier interface

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: All page loads (wraps all pages)
- Responsibilities: HTML document structure, global CSS, font loading, metadata

**Database Test Script:**
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

**What happens:** Creating `new PrismaClient()` on each API call or page render
**Why it's wrong:** Exhausts PostgreSQL connection pool, causes "too many connections" errors
**Do this instead:** Import singleton: `import prisma from "@/lib/prisma"` (see `lib/prisma.ts:10-14`)

### Bypassing Prisma Client in Components

**What happens:** Writing raw SQL queries or database logic in React components
**Why it's wrong:** Mixes concerns, loses type safety, harder to test and maintain
**Do this instead:** Keep data access in `lib/` layer; components import Prisma client for queries

## Error Handling

**Strategy:** Prisma-based error handling with try/catch

**Patterns:**
- Database connection errors caught at Prisma client level
- Validation errors caught in server components before database calls
- Error boundaries for client component rendering errors (React Suspense)

## Cross-Cutting Concerns

**Logging:** Console-based logging for scripts; no structured logging framework yet
**Validation:** Prisma schema-level constraints (unique, required fields); no app-level validation library yet
**Authentication:** Not implemented yet (User model exists in schema but no auth flow)

---

*Architecture analysis: 2026-07-06*
