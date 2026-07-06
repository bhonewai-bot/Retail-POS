import { NextRequest, NextResponse } from 'next/server';

// ─── Route Arrays ─────────────────────────────────────────────
const protectedPaths = ['/pos', '/admin'];
const adminPaths = ['/admin'];

function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some((path) => pathname.startsWith(path));
}

function isAdminPath(pathname: string): boolean {
  return adminPaths.some((path) => pathname.startsWith(path));
}

// ─── Session Cookie Decode ────────────────────────────────────
// Better Auth compact cookie format: base64url.payload.hmac
function decodeSessionCookie(cookieValue: string): Record<string, unknown> | null {
  try {
    const parts = cookieValue.split('.');
    if (parts.length < 3) {
      return null; // Not in compact format
    }

    // First part is base64url-encoded JSON payload
    const decoded = Buffer.from(parts[0], 'base64url');
    const text = new TextDecoder().decode(decoded);
    return JSON.parse(text);
  } catch {
    return null; // Invalid session data
  }
}

// ─── Middleware ────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('better-auth.session_token')?.value;

  // Not authenticated + protected route -> redirect to login
  if (!sessionCookie && isProtectedPath(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Authenticated + login page -> redirect to POS
  if (sessionCookie && pathname === '/login') {
    return NextResponse.redirect(new URL('/pos', request.url));
  }

  // Admin route + session -> check role
  if (isAdminPath(pathname) && sessionCookie) {
    const sessionData = decodeSessionCookie(sessionCookie);

    if (!sessionData) {
      // Invalid session cookie -> redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Access user role from decoded session
    const user = sessionData.user as Record<string, unknown> | undefined;
    const role = user?.role as string | undefined;

    if (role !== 'manager') {
      // Cashier cannot access admin routes (D-05) -> redirect to POS
      return NextResponse.redirect(new URL('/pos', request.url));
    }
    // Manager can access admin routes (D-06) -> continue
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/pos/:path*', '/admin/:path*', '/login'],
};
