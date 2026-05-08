import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

function getRoleFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.role ?? null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. API Proxy for external backend
  if (pathname.startsWith('/api/proxy/')) {
    const accessToken = request.cookies.get('access_token')?.value;
    const requestHeaders = new Headers(request.headers);

    if (accessToken) {
      requestHeaders.set('Authorization', `Bearer ${accessToken}`);
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const targetPath = pathname.replace(/^\/api\/proxy/, '');
    
    // Construct the target URL manually to preserve any base path in backendUrl (like /api)
    const targetUrl = `${backendUrl.replace(/\/$/, '')}${targetPath}${request.nextUrl.search}`;

    logger.debug(`[Proxy] ${request.method} ${pathname} -> ${targetUrl}`);

    return NextResponse.rewrite(new URL(targetUrl), {
      request: { headers: requestHeaders },
    });
  }

  // 2. Auth Route Protection (Enterprise SaaS Grade)
  const hasAccessToken = request.cookies.has('access_token');
  const hasRefreshToken = request.cookies.has('refresh_token');
  const isAuth = hasAccessToken || hasRefreshToken;
  
  // Define route types
  const protectedPrefixes = ['/dashboard', '/analytics', '/students', '/teachers', '/users', '/admin'];
  const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = pathname === '/login' || pathname.startsWith('/login/');
  const isPublicRoute = pathname === '/' || 
    pathname.startsWith('/_next/') || 
    pathname.startsWith('/api/auth/') || // Auth endpoints are public
    pathname.includes('.') || // Static files
    pathname === '/favicon.ico';

  // Skip middleware for public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isAuth) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // /admin is restricted to SUPER_ADMIN only
  if (pathname.startsWith('/admin') && isAuth) {
    const accessToken = request.cookies.get('access_token')?.value;
    const role = accessToken ? getRoleFromToken(accessToken) : null;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
