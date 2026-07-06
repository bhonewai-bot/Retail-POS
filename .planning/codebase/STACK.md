# Technology Stack

**Analysis Date:** 2026-07-06

## Languages

**Primary:**
- TypeScript 5 - All application code (`src/app/*.tsx`, `lib/*.ts`, `scripts/*.ts`)

**Secondary:**
- JavaScript (ES Modules) - Configuration files (`next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`)

## Runtime

**Environment:**
- Node.js 18+ (minimum required by Next.js 16)
- Next.js 16.2.10 - App Router architecture

**Package Manager:**
- npm (package-lock.json present)
- Lockfile version: 3

## Frameworks

**Core:**
- React 19.2.4 - UI library (`src/app/page.tsx`)
- Next.js 16.2.10 - Full-stack framework with App Router (`app/` directory)
- React DOM 19.2.4 - DOM rendering

**Styling:**
- Tailwind CSS 4 - Utility-first CSS framework (`src/app/globals.css`)
- PostCSS 8 - CSS processing with `@tailwindcss/postcss` plugin (`postcss.config.mjs`)

**Database:**
- Prisma 7.8.0 - Type-safe ORM (`prisma/schema.prisma`)
- @prisma/adapter-pg 7.8.0 - PostgreSQL adapter (`lib/prisma.ts`)
- @prisma/client 7.8.0 - Prisma client (`app/generated/prisma/`)

**Type Checking:**
- TypeScript 5 - Static type checking (`tsconfig.json`)
  - Target: ES2017
  - Strict mode: enabled
  - Module resolution: Bundler
  - JSX: react-jsx

**Code Quality:**
- ESLint 9 - Linting (`eslint.config.mjs`)
- eslint-config-next 16.2.10 - Next.js ESLint rules

**Build/Dev:**
- Next.js CLI - Dev server (`npm run dev`), Production build (`npm run build`)
- tsx 4.23.0 - TypeScript execution for scripts (`npm run db:test`)

## Key Dependencies

**Critical:**
- `next` 16.2.10 - Core framework (App Router, API routes, SSR/SSG)
- `react` 19.2.4 - UI rendering engine
- `prisma` 7.8.0 - Database ORM and migrations
- `@prisma/adapter-pg` 7.8.0 - PostgreSQL connection adapter

**Infrastructure:**
- `dotenv` 17.4.2 - Environment variable loading
- `tailwindcss` 4 - Styling system

**Development:**
- `typescript` 5 - Type safety
- `tsx` 4.23.0 - Script execution
- `eslint` 9 - Code quality

## Configuration

**Environment Variables:**
- Location: `.env` file (uses `dotenv/config` import)
- Required: `DATABASE_URL` (PostgreSQL connection string)
- Format: `postgres://[user]:[password]@[host]:[port]/[database]?sslmode=require`

**Build Configuration:**
- `next.config.ts` - Next.js configuration (minimal, using defaults)
- `tsconfig.json` - TypeScript compilation settings
- `postcss.config.mjs` - PostCSS plugin configuration
- `eslint.config.mjs` - ESLint rules
- `prisma.config.ts` - Prisma configuration (schema path, migrations, datasource)

**Database Configuration:**
- `prisma/schema.prisma` - Database schema definition
- Output: `app/generated/prisma/` (Prisma client)
- Adapter: PostgreSQL via `@prisma/adapter-pg`

## Package Scripts

```bash
npm run dev          # Start Next.js dev server
npm run build        # Build production bundle
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:test      # Test database connection and operations
npm run db:studio    # Open Prisma Studio GUI
npm run db:push      # Push schema to database
npm run db:generate  # Generate Prisma client
```

## Platform Requirements

**Development:**
- Node.js 18 or higher
- PostgreSQL database (local or remote)
- Network access to database host

**Production:**
- Node.js 18+ runtime
- PostgreSQL database with SSL support
- Environment variables configured via hosting platform
- Compatible with Vercel (based on README)

**Build:**
- TypeScript compilation
- Prisma client generation
- Next.js optimization

---

*Stack analysis: 2026-07-06*
