# Phase 1: Authentication - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning

<domain>
## Phase Boundary

User login system with role-based access control (cashier vs manager), session management, and route protection. This phase delivers the foundation for all user interactions in the POS system — every subsequent phase depends on authenticated users.

</domain>

<decisions>
## Implementation Decisions

### Auth Package
- **D-01:** Use **Better Auth** for authentication — modern, lightweight, excellent Prisma integration, TypeScript-first, free and open source

### Session Management
- **D-02:** Sessions persist **until explicit logout** — no automatic expiration. This simplifies POS terminal usage (cashiers stay logged in throughout their shift).

### Demo Users & Password Policy
- **D-03:** Seed database with **two demo users** via script:
  - `admin@demo.com` (role: manager)
  - `cashier@demo.com` (role: cashier)
  - Both use password: `demo1234` (8+ characters per policy)
- **D-04:** Enforce **8+ character minimum** password length — standard balance for demo security

### Route Protection
- **D-05:** **Cashiers cannot access admin routes** (`/admin/*`) — redirect to `/pos` with access denied message
- **D-06:** **Managers can access all routes** — both `/pos` and `/admin/*`

### Login UI
- **D-07:** **Full-page login screen** — typical for POS terminals, clean and focused without modal complexity

### Logout Behavior
- **D-08:** Logout redirects to **login page** (`/login`)
- **D-09:** **No confirmation dialog** — logout is instant (POS users expect fast workflow)

### Claude's Discretion
- Error messages during login (invalid credentials, server errors)
- Loading states and form validation UX
- Better Auth configuration options (cookie settings, JWT vs session strategies)
- Initial user creation flow in seed script

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Authentication Library
- `package.json` — Check current dependencies, plan to add better-auth
- `prisma/schema.prisma` §User model — Existing user structure (id, name, email, role, isActive)
- `lib/prisma.ts` — Prisma client singleton (will be used by Better Auth)

### Database Schema
- `prisma/schema.prisma` — Full schema with User, Product, Category, Order models

### Project Context
- `.planning/PROJECT.md` — Project goals, constraints, and scope
- `.planning/REQUIREMENTS.md` — Phase 1 requirements (AUTH-01 to AUTH-04)
- `.planning/ROADMAP.md` — Phase 1 success criteria

### Codebase Reference
- `.planning/codebase/ARCHITECTURE.md` — System architecture patterns
- `.planning/codebase/STACK.md` — Technology stack (Next.js 16, Prisma 7, TypeScript 5)
- `.planning/codebase/CONCERNS.md` — Known issues to avoid

No external ADRs or specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **User model** (`prisma/schema.prisma`): Already has id, name, email, role, isActive fields — can be extended for Better Auth
- **Prisma client** (`lib/prisma.ts`): Singleton pattern with PostgreSQL adapter — can be passed to Better Auth
- **Next.js App Router** (`src/app/`): Ready for route groups and middleware for route protection

### Established Patterns
- **TypeScript strict mode** (`tsconfig.json`): All code must be type-safe
- **Server Components default** (`src/app/page.tsx`): Use Server Components unless client interactivity needed
- **Tailwind CSS** (`src/app/globals.css`): Utility-first styling — login page should use existing theme tokens

### Integration Points
- **Middleware** (`src/middleware.ts`): Will need to be created for route protection
- **Login page** (`src/app/login/page.tsx`): New route to create
- **Dashboard** (`src/app/pos/page.tsx`): Post-login destination for cashiers
- **Admin** (`src/app/admin/page.tsx`): Post-login destination for managers

</code_context>

<specifics>
## Specific Ideas

- User mentioned experience with Better Auth — can leverage existing knowledge
- Demo is for portfolio/learning — code quality and patterns matter more than production hardening
- This is a POS system — authentication should feel fast and unobtrusive (minimal redirects, instant feedback)

No other specific requirements — open to standard Better Auth patterns and Next.js authentication best practices

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-Authentication*
*Context gathered: 2026-07-06*
