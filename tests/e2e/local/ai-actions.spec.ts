import { test, expect } from '@playwright/test';
import { SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';

/**
 * Guard for the copilot's confirm endpoint.
 *
 * The AI proposal flow used to hand the browser a `confirmUrl` and a
 * `confirmMethod` and call whatever it was given; the only check was an array
 * of allowed paths compared in client code, and the request body was not
 * validated anywhere. These tests pin the replacement: the action name is
 * resolved against a server-side allowlist and its payload is re-validated
 * before anything reaches the backend.
 *
 * Nothing here exercises a successful write — that would create real records.
 * Every case asserts a rejection, which is the part that must not regress.
 */

const SECRET = process.env.JWT_ACCESS_SECRET;

/**
 * A correctly signed token, so the tests reach the allowlist rather than auth.
 *
 * Each call gets a fresh subject. This endpoint is rate limited and its
 * counters live in the server process, so a shared identity would accumulate
 * across `playwright test` invocations until these cases started answering 429
 * instead of the 400 they assert.
 */
async function signedToken(role = 'ADMIN'): Promise<string> {
  const key = new TextEncoder().encode(SECRET);
  return new SignJWT({ sub: `sub_action_${randomUUID()}`, role, organization_id: 'org_test' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(key);
}

test.describe('POST /api/ai/actions', () => {
  test('a forged session cookie cannot drive a write', async ({ request }) => {
    // The middleware only checks that the cookie EXISTS, so this request gets
    // as far as the route. The route verifies the signature, and this one has
    // none worth trusting.
    const response = await request.post('/api/ai/actions', {
      headers: { Cookie: 'access_token=not.a.real.token' },
      data: { action: 'record_payment', payload: { student_id: 'x', amount: 1, method: 'CASH' } },
      maxRedirects: 0,
    });

    expect(response.status(), 'an unverifiable token must not reach the backend').toBe(401);
  });

  test.describe('with a valid session', () => {
    test.skip(
      !SECRET,
      'JWT_ACCESS_SECRET is not set for this run, so no token can be signed',
    );

    test('an action outside the allowlist is rejected', async ({ request }) => {
      const response = await request.post('/api/ai/actions', {
        headers: { Cookie: `access_token=${await signedToken()}` },
        data: { action: 'delete_student', payload: { student_id: '42' } },
        maxRedirects: 0,
      });

      expect(response.status(), 'only allowlisted actions may execute').toBe(400);
    });

    test('a prototype-chain name is not mistaken for an action', async ({ request }) => {
      // `'constructor' in AI_ACTIONS` is true; Object.hasOwn is what makes it false.
      const response = await request.post('/api/ai/actions', {
        headers: { Cookie: `access_token=${await signedToken()}` },
        data: { action: 'constructor', payload: {} },
        maxRedirects: 0,
      });

      expect(response.status()).toBe(400);
    });

    test('an allowlisted action with an invalid payload is rejected', async ({ request }) => {
      // Negative amount: a proposal the user confirmed as a payment must not be
      // able to run as a credit.
      const response = await request.post('/api/ai/actions', {
        headers: { Cookie: `access_token=${await signedToken()}` },
        data: {
          action: 'record_payment',
          payload: { student_id: 'stu_1', amount: -50000, method: 'CASH' },
        },
        maxRedirects: 0,
      });

      expect(response.status(), 'the payload is re-validated server-side').toBe(400);
    });

    test('an unknown payment method is rejected', async ({ request }) => {
      const response = await request.post('/api/ai/actions', {
        headers: { Cookie: `access_token=${await signedToken()}` },
        data: {
          action: 'record_payment',
          payload: { student_id: 'stu_1', amount: 1000, method: 'CRYPTO' },
        },
        maxRedirects: 0,
      });

      expect(response.status()).toBe(400);
    });
  });
});
