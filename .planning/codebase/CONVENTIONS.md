# Coding Conventions

**Analysis Date:** 2026-07-06

## Naming Patterns

**Files:**
- PascalCase for React components: `layout.tsx`, `page.tsx`
- camelCase for utility/helper files: `prisma.ts`
- kebab-case for configuration files: `postcss.config.mjs`
- Generated files follow directory convention: `app/generated/prisma/`

**Functions:**
- camelCase for all functions: `testDatabase()`, `getRootLayout()`
- React component names use PascalCase: `RootLayout`, `Home`

**Variables:**
- camelCase for variables and functions: `globalForPrisma`, `geistSans`
- UPPER_SNAKE_CASE for environment variables: `DATABASE_URL`, `NODE_ENV`
- Constants use camelCase: `prisma`, `adapter`

**Types:**
- PascalCase for types and interfaces: `Metadata`, `PrismaClient`
- Import types with explicit `type` keyword: `import type { Metadata } from "next"`

## Code Style

**Formatting:**
- No Prettier configuration detected
- ESLint with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- ESLint config: `eslint.config.mjs` (flat config format)
- Two-space indentation (default Next.js)
- Single quotes for strings
- Semicolons present

**Linting:**
- ESLint 9 with flat config
- Next.js TypeScript and React best practices enforced
- Strict TypeScript mode enabled in `tsconfig.json`

**TypeScript:**
- Strict mode enabled
- `noEmit: true` (build tool handles compilation)
- Module: ESNext with bundler resolution
- Path aliases: `@/*` maps to `./src/*`

## Import Organization

**Order:**
1. Type imports first: `import type { Metadata } from "next"`
2. Next.js framework imports: `import { Geist, Geist_Mono } from "next/font/google"`
3. Component imports: `import Image from "next/image"`
4. Local CSS imports: `import "./globals.css"`
5. Local utility imports: `import prisma from "../lib/prisma"`
6. External dependencies: `import { PrismaPg } from "@prisma/adapter-pg"`

**Path Aliases:**
- `@/*` → `./src/*` (used in imports like `@/components/Button`)

## Error Handling

**Patterns:**
- Async/await with try-catch-finally blocks
- Console logging for development errors: `console.error("❌ Error:", error)`
- Process exit for critical failures: `process.exit(1)`
- Cleanup in finally blocks: `await prisma.$disconnect()`

**Database Errors:**
- Prisma client initialization with error handling
- Use `upsert()` for idempotent operations
- Use `!` operator for non-null assertions when confident

## Comments

**When to Comment:**
- Schema/model section headers: `// ─── Categories ────────────`
- Schema field comments: `// cash, card, mobile, etc.`
- Script step numbering: `// Test 1: Check connection`
- No excessive inline comments

**Style:**
- Use `//` for single-line comments
- Use `//` for section separators with dashes: `// ─── Section Name ───────`
- Emoji for test output feedback: `console.log("✅ Connected!")`

## Function Design

**Size:**
- Keep functions focused on single responsibility
- Extract database logic into separate modules (e.g., `lib/prisma.ts`)

**Parameters:**
- Destructure props in React components: `{ children }`
- Use type assertions for global state: `global as unknown as { prisma: PrismaClient }`

**Return Values:**
- React components return JSX directly
- Async functions return Promises
- Use explicit type annotations for complex returns

## Module Design

**Exports:**
- Default exports for single-export modules: `export default prisma`
- Named exports for multiple exports: `export const metadata: Metadata`
- React components use default exports: `export default function RootLayout()`

**Barrel Files:**
- Not used in current codebase
- Direct imports preferred

## React/Next.js Patterns

**Component Structure:**
- Functional components only (no class components)
- React 19 with App Router
- Server Components by default (unless `'use client'` specified)
- Props typed inline: `Readonly<{ children: React.ReactNode }>`

**Styling:**
- Tailwind CSS 4 with PostCSS
- Dark mode support via `dark:` prefix
- CSS variables for theme: `:root { --background: #ffffff }`
- Use `className` for styling, not inline styles

## Database/ORM Patterns

**Prisma Setup:**
- Singleton pattern for client: global caching in non-production
- Adapter pattern for PostgreSQL: `PrismaPg`
- Schema-driven: auto-generate client to `app/generated/prisma/`

**Naming:**
- Model names: PascalCase (`Category`, `Product`, `Order`)
- Field names: camelCase (`createdAt`, `customerId`)
- Relations: use foreign key naming convention (`categoryId`)

**Operations:**
- Prefer `upsert()` for idempotent insertions
- Use `include` for eager loading related data
- Use `@@index()` for performance optimization
- Cascade deletes for required relationships

---

*Convention analysis: 2026-07-06*
