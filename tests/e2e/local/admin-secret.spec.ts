import { test, expect } from '@playwright/test';

/**
 * Guards for the workflow endpoints and for the proxy route deletion.
 *
 * The admin secret was compared with `!==`, which returns at the first byte
 * that differs — the time a rejection takes leaks how much of the prefix was
 * right, and these endpoints have no rate limit in front of them. The
 * comparison is now constant-time; these tests pin the rejections themselves,
 * since timing is not something a browser-level test can measure honestly.
 *
 * A correct secret is deliberately never sent: that would start a real workflow
 * run and send real WhatsApp messages.
 */

const WORKFLOW_PATH = '/api/workflows/payment-reminder';

test.describe('workflow admin secret', () => {
  test('a missing header is rejected', async ({ request }) => {
    const response = await request.post(WORKFLOW_PATH, { maxRedirects: 0 });
    expect(response.status()).toBe(401);
  });

  test('a wrong secret is rejected', async ({ request }) => {
    const response = await request.post(WORKFLOW_PATH, {
      headers: { 'x-admin-secret': 'definitely-not-the-secret' },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(401);
  });

  test('an empty secret is rejected', async ({ request }) => {
    // Fail-closed check: with ADMIN_SECRET unset, a bare `!==` comparison is
    // one coincidence away from letting everyone in.
    const response = await request.post(WORKFLOW_PATH, {
      headers: { 'x-admin-secret': '' },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(401);
  });

  test('GET run status is gated by the same check', async ({ request }) => {
    const response = await request.get(`${WORKFLOW_PATH}?runId=abc`, {
      headers: { 'x-admin-secret': 'wrong' },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(401);
  });

  test('the endpoint is reachable without a session cookie', async ({ request }) => {
    // Cron has no cookies. Middleware used to gate every /api/* path on a
    // session, which made this endpoint unreachable by its only caller — the
    // daily reminder pass could not be triggered at all. A 401 here is the
    // handler's own answer to a wrong secret; a redirect, or a 401 that
    // arrives before the handler runs, means the route is walled off again.
    const response = await request.get(`${WORKFLOW_PATH}?runId=abc`, {
      headers: { 'x-admin-secret': 'wrong' },
      maxRedirects: 0,
    });

    expect(response.status(), 'must not be redirected to the login page').not.toBe(307);
    expect(response.headers()['location'], 'no redirect target expected').toBeUndefined();
  });
});

test.describe('proxy path after route deletion', () => {
  test('/api/proxy/* is still handled, not 404', async ({ request }) => {
    // The route handler under src/app/api/proxy was dead — middleware rewrites
    // every /api/proxy/* request to the backend before a handler could run.
    // Deleting it must not turn the proxy into a 404.
    const response = await request.get('/api/proxy/health', { maxRedirects: 0 });

    expect(
      response.status(),
      'middleware must still own this path after the dead handler was removed',
    ).not.toBe(404);
  });
});
