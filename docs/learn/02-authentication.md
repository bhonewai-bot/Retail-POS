# Phase 1 — Authentication

> Better Auth with email/password, role-based access (cashier vs manager), session persistence, and route protection via Next.js 16 proxy.

## The problem

The POS system has two types of users with different permissions:

- **Cashiers** — can only access the POS terminal to process sales
- **Managers** — can access everything: POS, admin dashboard, product management

Without auth, anyone can walk up to the terminal and do anything. We need:

- A **login page** where users enter email and password
- **Session management** so users stay logged in across page refreshes
- **Role-based route protection** — cashiers blocked from `/admin`, managers can go anywhere
- **Password hashing** — never store plaintext passwords
- **Demo users** seeded for testing

## The rationale

| Decision | Why |
|---|---|
| **Better Auth** | Lightweight auth library with first-class Prisma support, email/password built-in, no OAuth overhead for a demo POS system. |
| **Prisma adapter** | Better Auth's Prisma adapter maps directly to our existing schema. Sessions, accounts, and verification tables are auto-managed. |
| **Next.js 16 proxy** | Replaces middleware for route protection. Runs before page renders, checks session cookie presence. Simpler than decoding JWT in middleware. |
| **Page-level role checks** | Role-based access control happens inside each page component via `getSession()`, not in the proxy. Cleaner separation of concerns. |
| **`String @default(cuid())` IDs** | Better Auth's Prisma adapter internally uses string IDs for all models. Using `cuid()` for User IDs avoids type mismatches. |
| **Cookie-based sessions** | Better Auth stores sessions in cookies (compact strategy). No need for server-side session lookups on every request. |

## What was built

- [`src/lib/auth.ts`](../../src/lib/auth.ts) — Better Auth server instance with Prisma adapter, email/password, session config, and custom `role` field
- [`src/lib/auth-client.ts`](../../src/lib/auth-client.ts) — Client-side auth utilities for React components
- [`src/app/api/auth/[...all]/route.ts`](../../src/app/api/auth/[...all]/route.ts) — Catch-all API route handling all auth endpoints
- [`src/app/login/page.tsx`](../../src/app/login/page.tsx) — Full-page login UI with email/password form, error handling, and role-based redirect
- [`src/proxy.ts`](../../src/proxy.ts) — Next.js 16 proxy for route protection (checks session cookie)
- [`src/app/pos/page.tsx`](../../src/app/pos/page.tsx) — POS terminal page (cashier-facing)
- [`src/app/admin/page.tsx`](../../src/app/admin/page.tsx) — Admin dashboard (manager-facing, with role check)
- [`scripts/seed-auth.ts`](../../scripts/seed-auth.ts) — Seed script creating demo users
- Prisma schema updates: `session`, `account`, `verification` models + `User.id` changed to `String`

## How it works

### Auth architecture

```
Browser → Proxy (checks cookie) → Page (checks role via getSession()) → Auth API (/api/auth/*)
   ↓                                                                              ↓
   └── cookie: better-auth.session_token ←──── Better Auth (creates session on login)
```

### The login flow

1. User visits `/login` → sees email/password form
2. User submits → `authClient.signIn.email({ email, password })`
3. Better Auth verifies password hash, creates session, sets `better-auth.session_token` cookie
4. Login page calls `getSession()` to get user role
5. Redirect: manager → `/admin`, cashier → `/pos`

### Route protection (proxy)

The proxy runs before every matched request. It does **one thing**: check if the session cookie exists.

```ts
// src/proxy.ts — simplified
export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('better-auth.session_token')?.value;

  // No cookie + protected route → redirect to login
  if (!sessionCookie && isProtectedPath(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Has cookie + on login page → redirect to POS
  if (sessionCookie && pathname === '/login') {
    return NextResponse.redirect(new URL('/pos', request.url));
  }

  return NextResponse.next();
}
```

**Why proxy doesn't check roles:** Decoding the Better Auth session cookie in the proxy is fragile — the cookie format is internal to Better Auth and can change. Instead, each page calls `authClient.getSession()` to get the role. This is the [recommended pattern](https://better-auth.com/docs/concepts/session-management).

### Role-based access in pages

The admin page checks the role after fetching the session:

```tsx
// src/app/admin/page.tsx — role check
const { data } = await authClient.getSession();
const user = data.user as Record<string, unknown>;
if (user?.role !== 'manager') {
  router.push('/pos');  // Cashiers can't see admin
  return;
}
```

### Better Auth + Prisma schema

Better Auth requires three tables: `session`, `account`, `verification`. The Prisma schema uses PascalCase model names with `@@map()` to create lowercase table names:

```prisma
model User {
  id       String @id @default(cuid())  // String ID — required by Better Auth adapter
  name     String
  email    String @unique
  role     String @default("cashier")
  isActive Boolean @default(true)
  sessions Session[]
  accounts Account[]
  @@map("user")
}

model Session {
  id        String   @id
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  @@map("session")
}

model Account {
  id         String  @id
  accountId  String
  providerId String
  userId     String
  user       User    @relation(fields: [userId], references: [id])
  password   String?
  @@map("account")
}
```

**Key detail:** `User.id` must be `String`, not `Int`. Better Auth's Prisma adapter internally treats all IDs as strings. Using `Int` causes `PrismaClientValidationError` because the adapter passes string values like `"1"` to queries that expect integers.

### Custom role field

Better Auth supports `additionalFields` for custom user properties:

```ts
// src/lib/auth.ts
export const auth = betterAuth({
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

This adds `role` to the user table. Access it in the client via `session.user.role` (cast to `Record<string, unknown>` since the type system doesn't know about custom fields).

### Cookie-based session management

Better Auth stores sessions in cookies by default (compact strategy):

```ts
session: {
  expiresIn: 60 * 60 * 24 * 365 * 100, // 100 years — no expiration for demo
  cookieCache: {
    enabled: true,
    maxAge: 60 * 5, // 5 minute cache — reduces DB lookups
    strategy: "compact", // Base64url + HMAC — smallest payload
  },
}
```

The cookie name is `better-auth.session_token` (default). The proxy checks for this cookie to determine if the user is authenticated.

### Seed script

`scripts/seed-auth.ts` creates two demo users:

```ts
await prisma.user.upsert({
  where: { email: 'admin@demo.com' },
  create: { name: 'Admin User', email: 'admin@demo.com', role: 'manager' },
});
```

Account records with hashed passwords are created separately using `better-auth/crypto`'s `hashPassword()`:

```ts
await prisma.account.create({
  data: {
    accountId: manager.id,
    providerId: 'credential',
    userId: manager.id,
    password: await hashPassword('demo1234'),
  },
});
```

## Trade-offs & gotchas

| Gotcha | What happened |
|---|---|
| **Int vs String IDs** | Better Auth's adapter passes userId as a string even when the schema says `Int`. Changed User.id to `String @default(cuid())` to fix `PrismaClientValidationError`. |
| **`npx auth@latest generate` duplicates** | The CLI creates PascalCase models with `@@map()`. If you already have lowercase models, you get duplicates. Remove the old ones. |
| **Proxy can't decode session cookie** | Better Auth's cookie format is opaque. Don't try to parse it in the proxy — use page-level `getSession()` instead. |
| **Env vars require restart** | `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` won't take effect until the dev server is restarted. Old cookies become invalid. |
| **`src/proxy.ts` location** | Must be at the same level as `src/app/` (inside `src/`), not at the project root. Next.js 16 docs: "Create proxy.ts in the project root, or inside src if applicable." |

## Explore it yourself

```bash
# Start the dev server
npm run dev

# Seed demo users (if not already seeded)
npm run seed:auth

# Visit the login page
open http://localhost:3000/login

# Test accounts
# admin@demo.com / demo1234 → lands on /admin (manager)
# cashier@demo.com / demo1234 → lands on /pos (cashier)

# Build check
npm run build
```
