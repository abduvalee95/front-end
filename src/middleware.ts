import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { verifyAccessToken } from '@/lib/auth/verify-token';
import { BACKEND_URL } from '@/lib/server-env';
import { canAccess } from '@/lib/rbac';

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. API Proxy for external backend
  if (pathname.startsWith('/api/proxy/')) {
    // CSRF defense-in-depth: state-changing requests must come from our own
    // origin. Browsers always send Origin on cross-site POST/PUT/PATCH/DELETE;
    // same-origin server-side fetches (e.g. AI tools) send none and pass.
    // Behind the nginx TLS proxy the container sees http://, so the expected
    // origin must be rebuilt from X-Forwarded-Proto/Host (nginx overwrites
    // both; a browser can't set X-Forwarded-* cross-site without a preflight).
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const origin = request.headers.get('origin');
      if (origin) {
        const proto =
          request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '');
        const host =
          request.headers.get('x-forwarded-host') ??
          request.headers.get('host') ??
          request.nextUrl.host;
        if (origin !== `${proto}://${host}`) {
          return NextResponse.json({ message: 'Cross-origin request rejected' }, { status: 403 });
        }
      }
    }

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
  const publicRoutes = [
    '/',
    '/robots.txt',
    '/sitemap.xml',
    '/opengraph-image',
    '/twitter-image',
    '/manifest.webmanifest',
  ];
  const authRoutes = ['/login']; // Routes that logged-in users shouldn't access (like login page)

  /**
   * Assets served straight out of /public.
   *
   * Anchored to a SINGLE path segment on purpose. `/logo.svg` is an asset;
   * `/students/42.svg` is the student-detail route with a crafted id. Any rule
   * that looks for a dot *anywhere* in the path — which is what the previous
   * `pathname.includes('.')` check did — hands an attacker every dynamic route
   * in the app as a public one, since `[id]` happily matches `abc.def`.
   *
   * Failing the other way is safe: a newly added nested asset would require a
   * session rather than skipping auth.
   */
  const ROOT_STATIC_ASSET =
    /^\/[^/]+\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|bmp|css|js|map|txt|xml|json|webmanifest|woff2?|ttf|otf|eot)$/;

  const isPublicRoute = publicRoutes.includes(pathname) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') || // Auth endpoints are public
    // Workflow runtime endpoints carry their own signed tokens (see
    // src/app/.well-known/workflow/**) and are called without a session.
    pathname.startsWith('/.well-known/') ||
    ROOT_STATIC_ASSET.test(pathname);

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

  // Generic RBAC: enforce role restrictions using a SIGNATURE-VERIFIED token,
  // so a forged/edited cookie cannot reach a role-gated route. A 'valid' or
  // 'expired' token both carry an authentic role (an expired token was still
  // validly signed) — we honour it and let the request through so the client
  // can silently refresh. Only 'invalid' (forged/malformed) yields a null role.
  // canAccess() then returns false; the `!startsWith('/dashboard')` guard
  // prevents redirecting /dashboard -> /dashboard forever.
  if (isAuth && isProtectedRoute) {
    const accessToken = request.cookies.get('access_token')?.value;
    if (accessToken) {
      const result = await verifyAccessToken(accessToken);
      const role = result.status === 'invalid' ? null : result.claims.role;

      // The platform SUPER_ADMIN lives in /admin — org CRM pages query
      // org-scoped endpoints that the backend denies for this role (403
      // toast spam). Keep page navigations in the console; API calls pass.
      if (role === 'SUPER_ADMIN' && !pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }

      if (!canAccess(pathname, role) && !pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Only framework-reserved prefixes are excluded here, because anything the
   * matcher skips never reaches the auth check above.
   *
   * The previous `.*\.(?:svg|png|…)$` exclusion was a second, independent
   * bypass of exactly the same shape as the `includes('.')` one: it is
   * unanchored, so `/students/42.png` matched it, middleware never ran, and
   * the route rendered to anonymous users. Extension-based exclusions cannot
   * be made safe while dynamic segments exist — /public assets are handled by
   * the single-segment ROOT_STATIC_ASSET rule inside the middleware instead.
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
