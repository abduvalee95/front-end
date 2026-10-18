import { expect, test } from '@playwright/test';
import { SignJWT } from 'jose';

test('two tabs serialize real visibility refreshes and send the newest HttpOnly cookie', async ({ page, context, baseURL }) => {
  test.skip(!process.env.JWT_ACCESS_SECRET, 'JWT_ACCESS_SECRET must match the local server for role-gated navigation');
  const user = {
    id: 'multitab-admin', full_name: 'Multitab Administrator', email: 'multitab@example.test',
    role: 'ADMIN', organization_id: '1ade4cc3-7a96-4a12-a58d-4c45bcb4cf53',
    organization_name: 'Multitab Center', is_active: true,
  };
  const token = await new SignJWT({ sub: user.id, role: user.role, organization_id: user.organization_id })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('5m')
    .sign(new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!));
  const csrfToken = 'c'.repeat(43);
  await context.addCookies([
    { name: 'NEXT_LOCALE', value: 'en', url: baseURL! },
    { name: 'access_token', value: token, url: baseURL!, httpOnly: true, sameSite: 'Lax' },
    { name: 'refresh_token', value: 'rotation-0', url: baseURL!, httpOnly: true, sameSite: 'Lax' },
    { name: 'auth_csrf', value: csrfToken, url: baseURL!, httpOnly: true, sameSite: 'Lax' },
  ]);
  // Control visibility events so opening the second tab cannot refresh early.
  await context.addInitScript(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
  });
  await context.route('**/api/auth/me', route => route.fulfill({ json: { user } }));
  await context.route('**/api/auth/csrf', route => route.fulfill({ json: { csrfToken } }));
  await context.route('**/api/proxy/**', route => route.fulfill({ json: [] }));

  let releaseFirst!: () => void;
  const firstResponse = new Promise<void>(resolve => { releaseFirst = resolve; });
  let firstStarted!: () => void;
  const firstRequest = new Promise<void>(resolve => { firstStarted = resolve; });
  const receivedCookies: string[] = [];
  let active = 0;
  let maximumActive = 0;
  let completed = 0;
  await context.route('**/api/auth/refresh', async route => {
    active++;
    maximumActive = Math.max(maximumActive, active);
    const headers = await route.request().allHeaders();
    const refreshCookie = headers.cookie?.split('; ').find(cookie => cookie.startsWith('refresh_token='))?.slice('refresh_token='.length);
    receivedCookies.push(refreshCookie ?? '');
    const sequence = receivedCookies.length;
    expect(headers['x-csrf-token']).toBe(csrfToken);
    if (sequence === 1) {
      firstStarted();
      await firstResponse;
    }
    await route.fulfill({
      json: { success: true },
      headers: { 'Set-Cookie': `refresh_token=rotation-${sequence}; Path=/; HttpOnly; SameSite=Lax` },
    });
    active--;
    completed++;
  });

  const second = await context.newPage();
  await Promise.all([page.goto('/invitations'), second.goto('/invitations')]);
  for (const tab of [page, second]) await expect(tab.locator('#invitation-email')).toBeVisible();

  // This calls the production SilentRefreshManager listener, not a test copy of authRequest.
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await firstRequest;
  await second.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(async () => second.evaluate(async () => {
    const snapshot = await navigator.locks.query();
    return snapshot.pending?.filter(lock => lock.name === 'bilim-nuru-auth-session').length ?? 0;
  })).toBe(1);
  expect(receivedCookies).toEqual(['rotation-0']);
  releaseFirst();
  await expect.poll(() => completed).toBe(2);
  expect(maximumActive).toBe(1);
  expect(receivedCookies).toEqual(['rotation-0', 'rotation-1']);
  await expect.poll(async () => (await context.cookies(baseURL!)).find(cookie => cookie.name === 'refresh_token')?.value).toBe('rotation-2');
  for (const tab of [page, second]) {
    await expect(tab).toHaveURL(/\/invitations$/);
    expect(await tab.evaluate(() => document.cookie)).not.toContain('refresh_token');
  }
});
