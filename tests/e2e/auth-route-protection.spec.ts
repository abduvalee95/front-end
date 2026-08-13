import { test, expect } from '@playwright/test';

/**
 * Route-protection guard for the middleware.
 *
 * These exist because of a real auth bypass with two independent causes,
 * both of the same shape — treating "the path contains a dot" as "this is a
 * static file, let it through":
 *
 *   1. `pathname.includes('.')` in the middleware body.
 *   2. an unanchored `.*\.(?:svg|png|…)$` exclusion in the matcher config,
 *      which skipped the middleware entirely.
 *
 * Neither is safe while dynamic segments exist: `[id]` matches `abc.def` just
 * as happily as `abc`, so `/students/42.png` rendered to anonymous users.
 *
 * Requests are made without following redirects and without a session cookie,
 * so a protected route must answer with a redirect to /login — never 200.
 */

/** Protected routes, including the crafted-extension variants that bypassed. */
const PROTECTED_PATHS = [
  '/students',
  '/students/abc',
  '/students/abc.def',
  '/students/abc.png',
  '/students/abc.svg',
  '/groups/xyz.json',
  '/groups/x.webp',
  '/settings',
  '/finance',
  '/journal',
];

/** Must stay reachable pre-login: the login page needs its own assets. */
const PUBLIC_PATHS = ['/login', '/', '/logo.svg', '/manifest.webmanifest'];

test.describe('middleware route protection', () => {
  for (const path of PROTECTED_PATHS) {
    test(`anonymous request to ${path} is redirected to login`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });

      expect(
        response.status(),
        `${path} should redirect an anonymous visitor, not serve a page`,
      ).toBe(307);
      expect(response.headers()['location'] ?? '').toContain('/login');
    });
  }

  for (const path of PUBLIC_PATHS) {
    test(`public path ${path} stays reachable without a session`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), `${path} should be served anonymously`).toBe(200);
    });
  }

  test('a crafted extension does not resolve to a rendered page', async ({ request }) => {
    // Single-segment paths ending in a static extension are allowed through as
    // /public assets. That is only safe while no root-level dynamic route
    // exists to catch them — if one is ever added, this assertion fails and
    // the ROOT_STATIC_ASSET rule in middleware.ts has to be revisited.
    const response = await request.get('/finance.json', { maxRedirects: 0 });
    expect(response.status()).toBe(404);
  });
});
