import { NextRequest, NextResponse } from 'next/server';

// ─── Route Arrays ─────────────────────────────────────────────
const protectedPaths = ['/pos', '/admin'];

function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some((path) => pathname.startsWith(path));
}

// ─── Proxy (Next.js 16 renamed middleware to proxy) ────────────
// Role-based access control is handled by each page via getSession().
// Proxy only checks: is the user authenticated (has session cookie)?
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('better-auth.session_token')?.value;

  // Not authenticated + protected route -> redirect to login
  if (!sessionCookie && isProtectedPath(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Authenticated + login page -> redirect to default dashboard
  if (sessionCookie && pathname === '/login') {
    return NextResponse.redirect(new URL('/pos', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/pos/:path*', '/admin/:path*', '/login'],
};
