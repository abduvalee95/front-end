import { test, expect } from '@playwright/test';
import { SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';

/**
 * Auth and rate limiting on the routes a caller can spend money through.
 *
 * /api/chat calls a paid model provider and used to answer anyone who could
 * reach the URL, with no session and no ceiling — one loop was enough to drain
 * the quota and take the copilot down for every user. (/api/ai/insights had the
 * same hole; it has since been deleted, since nothing ever called it.)
 *
 * The rate limiter is per-process, so each test signs a token with its OWN
 * subject; counters are keyed by user id and cannot bleed between tests.
 */

const SECRET = process.env.JWT_ACCESS_SECRET;

/** Mirrors ACTIONS_RATE_LIMIT in the route; a burst has to exceed it to matter. */
const ACTIONS_LIMIT = 20;

/**
 * A subject nobody has spent quota under.
 *
 * Counters live in the server process and survive between `playwright test`
 * invocations, so a fixed subject makes these specs pass once and then fail on
 * every re-run against the same server. The label is only there to make a
 * failure readable.
 */
function freshSubject(label: string): string {
  return `sub_${label}_${randomUUID()}`;
}

async function signedToken(sub: string): Promise<string> {
  const key = new TextEncoder().encode(SECRET);
  return new SignJWT({ sub, role: 'ADMIN', organization_id: 'org_test' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(key);
}

const GUARDED_ENDPOINTS = ['/api/chat', '/api/ai/actions'];

test.describe('AI endpoint protection', () => {
  for (const path of GUARDED_ENDPOINTS) {
    test(`${path} refuses an anonymous caller with JSON, not a redirect`, async ({ request }) => {
      const response = await request.post(path, { data: {}, maxRedirects: 0 });

      // 401 rather than 307: fetch() follows redirects, so a redirected write
      // hands the caller the login page's 200 and reads as success.
      expect(response.status(), `${path} must not serve anonymous callers`).toBe(401);
    });

    test(`${path} refuses a forged token`, async ({ request }) => {
      const response = await request.post(path, {
        headers: { Cookie: 'access_token=not.a.real.token' },
        data: {},
        maxRedirects: 0,
      });

      expect(response.status()).toBe(401);
    });
  }

  test.describe('with a valid session', () => {
    test.skip(!SECRET, 'JWT_ACCESS_SECRET is not set for this run');

    test('a burst past the limit is answered with 429 and Retry-After', async ({ request }) => {
      // Bursts against /api/ai/actions: its rate check runs before the body is
      // even parsed, so a refused request costs nothing and never reaches the
      // backend. Every call below carries a deliberately invalid payload, so a
      // request that gets past the limiter answers 400 rather than writing.
      const cookie = `access_token=${await signedToken(freshSubject('burst'))}`;
      const statuses: number[] = [];

      for (let i = 0; i < ACTIONS_LIMIT + 2; i += 1) {
        const response = await request.post('/api/ai/actions', {
          headers: { Cookie: cookie },
          data: { action: 'record_payment', payload: {} },
          maxRedirects: 0,
        });
        statuses.push(response.status());

        if (response.status() === 429) {
          expect(response.headers()['retry-after'], 'a 429 must say when to retry').toBeTruthy();
          expect(response.headers()['x-ratelimit-limit']).toBe(String(ACTIONS_LIMIT));
          expect(response.headers()['x-ratelimit-remaining']).toBe('0');
        }
      }

      expect(statuses.filter((s) => s === 429).length, 'the burst must be throttled').toBeGreaterThan(0);
      expect(
        statuses.slice(0, ACTIONS_LIMIT),
        `the first ${ACTIONS_LIMIT} are within budget`,
      ).not.toContain(429);
    });

    test('a separate user is not throttled by someone else’s burst', async ({ request }) => {
      const response = await request.post('/api/ai/actions', {
        headers: { Cookie: `access_token=${await signedToken(freshSubject('quiet'))}` },
        data: { action: 'record_payment', payload: {} },
        maxRedirects: 0,
      });

      expect(response.status(), 'limits are keyed per user').not.toBe(429);
    });

    test('chat rejects a non-array messages field with 400, not 500', async ({ request }) => {
      const response = await request.post('/api/chat', {
        headers: { Cookie: `access_token=${await signedToken(freshSubject('badbody'))}` },
        data: { messages: 'not an array' },
        maxRedirects: 0,
      });

      expect(response.status()).toBe(400);
    });

    test('chat refuses an oversized transcript', async ({ request }) => {
      const response = await request.post('/api/chat', {
        headers: { Cookie: `access_token=${await signedToken(freshSubject('bigbody'))}` },
        data: {
          messages: Array.from({ length: 60 }, () => ({ role: 'user', content: 'hello' })),
        },
        maxRedirects: 0,
      });

      expect(response.status(), 'the whole transcript is billed on every turn').toBe(413);
    });
  });
});
