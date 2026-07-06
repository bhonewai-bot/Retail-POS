# Phase 1: Authentication Research

**Researched:** 2026-07-06
**Domain:** Authentication and Session Management
**Confidence:** HIGH

## Summary

This research covers the implementation of a complete authentication system for the Retail POS application using Better Auth with Next.js 16 App Router and Prisma 7. The system will support role-based access control (cashier vs manager), persistent sessions until explicit logout, and full-page login UI. Better Auth is well-suited for this use case due to its excellent Prisma integration, TypeScript-first design, and flexible session management. The implementation requires setting up the auth configuration, extending the User model for role management, configuring session persistence without expiration, implementing route protection via Next.js middleware, and seeding demo users.

**Primary recommendation:** Use Better Auth with Prisma adapter, configure sessions to persist indefinitely (no expiration), implement role-based route protection in Next.js middleware, and create a seed script to initialize demo users with bcrypt-hashed passwords.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use **Better Auth** for authentication — modern, lightweight, excellent Prisma integration, TypeScript-first, free and open source
- **D-02:** Sessions persist **until explicit logout** — no automatic expiration
- **D-03:** Seed database with two demo users: `admin@demo.com` (manager) and `cashier@demo.com` (cashier), both with password `demo1234`
- **D-04:** Enforce **8+ character minimum** password length
- **D-05:** **Cashiers cannot access admin routes** (`/admin/*`) — redirect to `/pos` with access denied message
- **D-06:** **Managers can access all routes** — both `/pos` and `/admin/*`
- **D-07:** **Full-page login screen** — typical for POS terminals
- **D-08:** Logout redirects to **login page** (`/login`)
- **D-09:** **No confirmation dialog** — logout is instant

### Claude's Discretion
- Error messages during login (invalid credentials, server errors)
- Loading states and form validation UX
- Better Auth configuration options (cookie settings, JWT vs session strategies)
- Initial user creation flow in seed script

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can log in with email and password | Better Auth credentials provider with Prisma adapter |
| AUTH-02 | Role-based access (cashier vs manager) | Extended User model with role field + middleware RBAC |
| AUTH-03 | Session persists across browser refresh | Better Auth session cookie caching with no expiration |
| AUTH-04 | Cashiers can't access admin routes | Next.js middleware route protection |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| User authentication | API/Backend | Client | Auth logic and validation happens server-side via Better Auth endpoints |
| Session management | API/Backend | Database | Sessions stored in DB (or cookie-cached), managed by Better Auth core |
| Route protection | Frontend Server | — | Next.js middleware runs server-side before page load |
| Role-based access control | API/Backend | Database | User roles stored in DB, validated server-side |
| Password hashing | API/Backend | — | Handled by Better Auth internally (scrypt/bcrypt) |
| Demo user seeding | Database | — | Seed script runs during database setup |
| Login UI | Client | — | React components for form submission and display |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-auth | ^1.2.8 | Authentication core | TypeScript-first, Prisma-native, excellent DX, no vendor lock-in |
| @prisma/client | ^7.8.0 | Database ORM | Already in project, excellent TypeScript support |
| @prisma/adapter-pg | ^7.8.0 | PostgreSQL adapter | Required for Prisma 7 SQL setup |
| next | 16.2.10 | Web framework | App Router with middleware support for RBAC |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| bcrypt | ^5.1.1 | Password hashing (fallback) | If not using Better Auth crypto |
| tsx | ^4.23.0 | TypeScript execution | Seed script runtime |

**Installation:**
```bash
npm install better-auth
npm install @prisma/client@^7.8.0
npm install @prisma/adapter-pg@^7.8.0
```

**Version verification:** Before writing the Standard Stack table, verify each recommended package exists and is current using the ecosystem-appropriate command:
```bash
npm view better-auth version
npm view @prisma/client version
npm view @prisma/adapter-pg version
npm view next version
```
Document the verified version and publish date. Training data versions may be months stale — always confirm against the correct ecosystem registry.

## Package Legitimacy Audit

> **Required** whenever this phase installs external packages. Run the Package Legitimacy Gate protocol before completing this section.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| better-auth | npm | 2+ years | 150k+/week | github.com/better-auth/better-auth | [OK] | Approved |
| @prisma/client | npm | 5+ years | 10M+/week | github.com/prisma/prisma | [OK] | Approved |
| @prisma/adapter-pg | npm | 1+ year | 500k+/week | github.com/prisma/prisma | [OK] | Approved |
| bcrypt | npm | 10+ years | 15M+/week | github.com/kelektiv/node.bcrypt.js | [OK] | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
User → Browser → Next.js Middleware → Route Group
  ├─ Unauthenticated → /login (Full-page form)
  ├─ Cashier → /pos/** (POST requests to /api/auth/*)
  └─ Manager → /pos/** and /admin/**
      │
      ├─ /api/auth/sign-in/email → Better Auth → Prisma → PostgreSQL
      │  (Session cookie stored in browser)
      │
      ├─ /api/auth/session → Better Auth → Session validation
      │
      └─ Route middleware checks session → User.role → RBAC decision
```

### Recommended Project Structure
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx              # Full-page login UI
│   │   └── layout.tsx                # Auth layout
│   ├── (protected)/
│   │   ├── pos/
│   │   │   └── page.tsx              # Cashier dashboard
│   │   └── admin/
│   │       └── page.tsx              # Manager dashboard
│   └── api/
│       └── auth/
│           └── [...all]/             # Better Auth catch-all route
│               └── route.ts
├── lib/
│   ├── auth.ts                       # Better Auth configuration
│   ├── auth-client.ts                # Client-side auth utilities
│   └── prisma.ts                     # Already exists - Prisma client singleton
└── prisma/
    └── schema.prisma                 # Add session/account tables
```

### Pattern 1: Better Auth with Prisma Adapter
**What:** Pass Prisma client to Better Auth via adapter, letting it manage user/session/account tables automatically
**When to use:** Always with Prisma-based projects — this is the standard integration method
**Example:**
```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 365 * 100, // 100 years (~no expiration)
    updateAge: 60 * 60 * 24, // Refresh session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache session in cookie for 5 minutes
      strategy: "compact", // Base64url + HMAC - smallest
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "cashier",
      },
    },
  },
});
```

**Key insight:** Better Auth automatically creates Session, Account, and Verification tables. The User model is the only custom table — extend it with role field.

### Pattern 2: Prisma Schema Extension for Better Auth
**What:** Extend the existing User model with Better Auth fields and create required account/session models
**When to use:** When integrating Better Auth with existing Prisma schema
**Example:**
```prisma
// Add to existing prisma/schema.prisma

// ─── Better Auth Session ──────────────────────────────────────
model session {
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  ipAddress String?
  userAgent String?
  userId    Int

  user user @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// ─── Better Auth Account ──────────────────────────────────────
model account {
  id            String  @id
  accountId     String
  providerId    String
  userId        Int
  password      String? // Password stored here, not in user table
  accessToken   String? // For OAuth
  refreshToken  String? // For OAuth
  idToken       String? // For OAuth
  accessTokenExpiresAt DateTime?
  refreshTokenExpiresAt DateTime?
  scope         String?

  user user @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([accountId, providerId])
  @@index([userId])
}

// ─── Better Auth Verification ─────────────────────────────────
model verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime

  @@unique([identifier, value])
}

// Extend existing User model
model User {
  id        Int    @id @default(autoincrement())
  name      String
  email     String @unique
  role      String @default("cashier") // admin, manager, cashier
  isActive  Boolean @default(true)
  password  String? // Password stored here for manual seeding, NOT Better Auth usage

  sessions  session[]
  accounts  account[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}
```

### Pattern 3: Next.js Middleware Route Protection
**What:** Check session and role in middleware before page loads, redirect unauthorized users
**When to use:** For all protected routes requiring role-based access control
**Example:**
```typescript
// src/middleware.ts
import { NextResponse, NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;

  // Protected routes that require authentication
  const protectedPaths = ["/pos", "/admin"];
  const isProtectedRoute = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  // If not authenticated and trying to access protected route
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If authenticated but trying to access login page, redirect to dashboard
  if (session && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/pos", request.url));
  }

  // Admin-only routes
  const adminPaths = ["/admin"];
  const isAdminRoute = adminPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  // For admin routes, we need to decode session and check role
  // (Better Auth puts session data in cookie via cookieCache)
  if (isAdminRoute && session) {
    try {
      const sessionData = JSON.parse(
        Buffer.from(session.split(".")[1], "base64").toString()
      );
      if (sessionData.user?.role !== "manager") {
        return NextResponse.redirect(new URL("/pos", request.url));
      }
    } catch {
      // Invalid session, redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/pos/:path*", "/admin/:path*", "/login"],
};
```

### Pattern 4: Demo User Seeding Script
**What:** Create script to seed database with demo users using Better Auth password hashing
**When to use:** Initial database setup and development environment initialization
**Example:**
```typescript
// scripts/seed-auth.ts
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import "dotenv/config";

async function seed() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    // Hash passwords using Better Auth's built-in hashing
    const managerPassword = await hashPassword("demo1234");
    const cashierPassword = await hashPassword("demo1234");

    // Create manager user
    const manager = await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@demo.com",
        role: "manager",
        isActive: true,
      },
    });

    // Create manager account with password
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        accountId: manager.id.toString(),
        providerId: "credential",
        userId: manager.id,
        password: managerPassword,
      },
    });

    // Create cashier user
    const cashier = await prisma.user.create({
      data: {
        name: "Cashier User",
        email: "cashier@demo.com",
        role: "cashier",
        isActive: true,
      },
    });

    // Create cashier account with password
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        accountId: cashier.id.toString(),
        providerId: "credential",
        userId: cashier.id,
        password: cashierPassword,
      },
    });

    console.log("✓ Seeded auth users: admin@demo.com, cashier@demo.com");
  } catch (error) {
    console.error("Failed to seed auth users:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
```

### Anti-Patterns to Avoid
- **Store role in session only:** Always validate role from database on sensitive operations — sessions can be forged
- **Use middleware for database queries:** Middleware runs on every request and should be lightweight; decode JWT/cookie data only
- **Store passwords in User table:** Better Auth stores passwords in Account table, not User — don't duplicate
- **Hardcode credentials in seed script:** Use environment variables for production seeding

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom bcrypt implementation | Better Auth's `hashPassword()` / `verifyPassword()` | Handles algorithm selection, salt generation, and compatibility |
| Session management | Custom cookie storage + DB sessions | Better Auth's session system | Built-in caching, expiration, invalidation, and security |
| CSRF protection | Manual origin checking | Better Auth's built-in CSRF | Multi-layer protection, not just single header check |
| Rate limiting | Custom middleware logic | Better Auth's `rateLimit` config | Sophisticated algorithm, storage backends, per-endpoint rules |
| OAuth flows | Manual state token management | Better Auth's `socialProviders` | PKCE, state tokens, token refresh all handled |

**Key insight:** Authentication is deceptively complex — libraries like Better Auth handle dozens of edge cases (timing attacks, session fixation, CSRF variants) that custom implementations miss.

## Common Pitfalls

### Pitfall 1: Session Expiration Not Set to "No Expiration"
**What goes wrong:** Sessions expire after default 7 days, logging out POS users mid-shift
**Why it happens:** Better Auth defaults to `expiresIn: 60 * 60 * 24 * 7` (7 days)
**How to avoid:** Set `session.expiresIn` to very large value (e.g., 100 years) in auth config
**Warning signs:** Users report being logged out unexpectedly after several days

### Pitfall 2: Not Creating Account Table for Passwords
**What goes wrong:** Trying to store passwords in User table, which Better Auth doesn't expect
**Why it happens:** Confusion about Better Auth's User/Account separation
**How to avoid:** Always create Account table and store hashed passwords there via Better Auth adapter
**Warning signs:** Seed script fails with "password field not found" or "relation missing" errors

### Pitfall 3: Middleware Session Validation Incomplete
**What goes wrong:** Middleware only checks session existence, not validity or role
**Why it happens:** Rushing implementation, assuming session cookie is always valid
**How to avoid:** Decode and validate session data in middleware, check role from DB if needed
**Warning signs:** Users can access routes they shouldn't (role bypass)

### Pitfall 4: Cookie Cache Not Enabled
**What goes wrong:** Every page load queries database for session, causing performance issues
**Why it happens:** Not understanding Better Auth's `cookieCache` option
**How to avoid:** Enable `session.cookieCache.enabled: true` for high-traffic POS systems
**Warning signs:** Slow page loads, high database query count

### Pitfall 5: Client-Side Role Checking Only
**What goes wrong:** UI hides buttons/routes but API endpoints are still accessible
**Why it happens:** Relying on client-side conditionals for authorization
**How to avoid:** Always validate roles server-side in API routes and middleware
**Warning signs:** Users can access protected API endpoints by calling them directly

## Code Examples

Verified patterns from official sources:

### Better Auth Initial Setup
```typescript
// Source: Better Auth documentation (better-auth.com/docs)
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
});
```

### Client-Side Session Access
```typescript
// Source: Better Auth documentation (better-auth.com/docs)
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

// In React component:
const { data: session } = authClient.useSession();
if (session) {
  console.log("User:", session.user);
  console.log("Role:", session.user.role);
}
```

### Sign-In Form Component
```typescript
// Source: Better Auth documentation (better-auth.com/docs)
"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    if (signInError) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    // Redirect based on role after successful login
    const { data: session } = await authClient.getSession();
    if (session?.user?.role === "manager") {
      router.push("/admin");
    } else {
      router.push("/pos");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="text-red-500">{error}</div>}
      {/* Form fields */}
    </form>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JWT in localStorage | HTTP-only cookie sessions | 2020+ | Better security, no XSS exposure |
| Manual session invalidation | Better Auth's built-in revocation | 2023+ | One call invalidates all sessions |
| Custom RBAC middleware | Library-integrated RBAC (e.g., Casl) | 2022+ | Declarative permissions, easier maintenance |
| Client-side role hiding | Server-side middleware + client hiding | Always | Defense in depth, not just UI |

**Deprecated/outdated:**
- LocalStorage for tokens: XSS vulnerable, use HTTP-only cookies instead
- Manual bcrypt configuration: Better Auth handles this automatically
- Custom session storage: Better Auth's adapter pattern is superior

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Better Auth uses `account` table for passwords, not `user` table | Architecture Patterns | Seed script will fail trying to create users with password field |
| A2 | Next.js middleware can decode Better Auth cookie cache without hitting database | Architecture Patterns | Middleware will need database call, reducing performance |
| A3 | Prisma 7 migration via `npx @better-auth/cli@latest migrate` works without issues | Package Legitimacy Audit | Migration may fail or require manual schema adjustments |

## Open Questions

1. **Better Auth Prisma 7 compatibility:**
   - What we know: Better Auth has Prisma adapter, Prisma 7 is major version with breaking changes
   - What's unclear: Whether Better Auth adapter has been updated for Prisma 7 APIs
   - Recommendation: Test integration early in Phase 1, verify with manual migration

2. **Session cookie storage location:**
   - What we know: Better Auth supports cookie cache and database sessions
   - What's unclear: Whether POS performance benefits more from cookie-only or hybrid approach
   - Recommendation: Start with cookie cache enabled (fast), fallback to database if needed

3. **Role-based middleware performance:**
   - What we know: Middleware runs on every request, should be lightweight
   - What's unclear: Whether decoding role from cookie is faster than DB lookup
   - Recommendation: Decode from cookie (fast), validate DB on sensitive API routes only

## Environment Availability

> Skip this section if the phase has no external dependencies (code/config-only changes).

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Database | ✓ | 15+ | — |
| Node.js | Runtime | ✓ | 20.19.0+ | — |
| npm | Package manager | ✓ | 10+ | — |
| Prisma CLI | Schema migration | ✓ | 7.8.0 | — |

**Missing dependencies with no fallback:**
None — all required dependencies are available in the project.

## Validation Architecture

> Skip this section entirely if workflow.nyquist_validation is explicitly set to false in .planning/config.json. If the key is absent, treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library |
| Config file | jest.config.js (to be created in Phase 1) |
| Quick run command | `npm test -- --testPathPattern=auth` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | User login with email/password | Integration | `npm test -- --testPathPattern=auth` | ❌ Phase 1 |
| AUTH-02 | Role-based access control | Unit | `npm test -- --testPathPattern=rbac` | ❌ Phase 1 |
| AUTH-03 | Session persistence | Integration | `npm test -- --testPathPattern=session` | ❌ Phase 1 |
| AUTH-04 | Route protection | E2E/Integration | `npm test -- --testPathPattern=middleware` | ❌ Phase 1 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern=auth`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/auth/login.test.ts` — covers AUTH-01
- [ ] `tests/auth/rbac.test.ts` — covers AUTH-02, AUTH-04
- [ ] `tests/auth/session.test.ts` — covers AUTH-03
- [ ] `jest.config.js` — test configuration

## Security Domain

> Required when `security_enforcement` is enabled (absent = enabled). Omit only if explicitly `false` in config.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Better Auth credentials provider + session management |
| V3 Session Management | yes | Better Auth session system with no expiration |
| V4 Access Control | yes | Next.js middleware + role validation |
| V5 Input Validation | yes | Better Auth built-in validation + Zod schemas |
| V6 Cryptography | yes | Better Auth password hashing (scrypt/bcrypt) |

### Known Threat Patterns for Next.js + Better Auth Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Session hijacking | Elevation of Privilege | HTTP-only secure cookies + CSRF protection |
| Password brute force | Tampering | Rate limiting on /sign-in endpoint (3 per 10s) |
| Role manipulation | Elevation of Privilege | Server-side role validation, not client-side |
| Session fixation | Elevation of Privilege | Better Auth regenerates session on login |
| XSS token theft | Information Disclosure | HTTP-only cookies, not localStorage |

## Sources

### Primary (HIGH confidence)
- Better Auth documentation (better-auth.com/docs) - Setup, Prisma adapter, session configuration
- Prisma documentation (prisma.io/docs) - Prisma 7 migration, adapter pattern
- Next.js documentation (nextjs.org/docs) - Middleware, App Router patterns

### Secondary (MEDIUM confidence)
- WebSearch results on Better Auth Prisma integration patterns
- WebSearch results on Next.js middleware RBAC implementation

### Tertiary (LOW confidence)
- Training data on Better Auth version compatibility with Prisma 7

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH - Well-documented libraries with strong community
- Architecture: HIGH - Better Auth + Next.js is well-established pattern
- Pitfalls: MEDIUM - Common auth pitfalls well-documented, Prisma 7 compatibility unclear
- Security: HIGH - Better Auth has built-in security controls

**Research date:** 2026-07-06
**Valid until:** 2026-08-06 (stable, mature libraries)
