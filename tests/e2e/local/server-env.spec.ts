import { test, expect } from '@playwright/test';

import { BACKEND_URL } from '@/lib/server-env';

/**
 * Backend URL normalisation.
 *
 * A pure-function check, kept in the Playwright suite because that is the
 * only runner this project configures. It needs no browser.
 *
 * It exists because a Preview deployment had `API_URL` set to
 * `back-end-theta-two.vercel.app` with no scheme. `fetch()` requires an
 * absolute URL, so every login threw `ERR_INVALID_URL` at request time and
 * looked, from the outside, exactly like a backend outage.
 */
test.describe('server-env', () => {
  test('resolves to an absolute, fetchable origin', () => {
    expect(() => new URL(`${BACKEND_URL}/api/auth/login`)).not.toThrow();
    expect(BACKEND_URL).toMatch(/^https?:\/\//);
    expect(BACKEND_URL).not.toMatch(/\/$/);
  });
});
