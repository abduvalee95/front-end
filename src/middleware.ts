import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getRoleFromToken } from '@/lib/auth/jwt';
import { BACKEND_URL } from '@/lib/server-env';

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. API Proxy for external backend
  if (pathname.startsWith('/api/proxy/')) {
    const accessToken = request.cookies.get('access_token')?.value;
    const requestHeaders = new Headers(request.headers);

    if (accessToken) {
      requestHeaders.set('Authorization', `Bearer ${accessToken}`);
    }

    const targetPath = pathname.replace(/^\/api\/proxy/, '');

    // Backend has a global `/api` prefix (NestJS setGlobalPrefix('api'))
    const targetUrl = `${BACKEND_URL.replace(/\/$/, '')}/api${targetPath}${request.nextUrl.search}`;

    logger.debug(`[Proxy] ${request.method} ${pathname} -> ${targetUrl}`);

    return NextResponse.rewrite(new URL(targetUrl), {
      request: { headers: requestHeaders },
    });
  }

  // 2. Auth Route Protection (Enterprise SaaS Grade)
  const hasAccessToken = request.cookies.has('access_token');
  const hasRefreshToken = request.cookies.has('refresh_token');
  const isAuth = hasAccessToken || hasRefreshToken;
  
  // Define route types by explicit public lists instead of hardcoded protected ones
  const publicRoutes = ['/'];
  const authRoutes = ['/login']; // Routes that logged-in users shouldn't access (like login page)

  const isPublicRoute = publicRoutes.includes(pathname) || 
    pathname.startsWith('/_next/') || 
    pathname.startsWith('/api/auth/') || // Auth endpoints are public
    pathname.includes('.') || // Static files
    pathname === '/favicon.ico';

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Any route that is not explicitly public or auth is considered protected
  const isProtectedRoute = !isPublicRoute && !isAuthRoute;

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
