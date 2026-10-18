import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test';
import { SignJWT } from 'jose';

/**
 * Browser wiring checks against mocked BFF responses. These exercise the real
 * pages and middleware, but do not claim Google, SMTP or a live database work.
 * The final describe block calls the real BFF for its local security boundary.
 */
const account = { id: 'account-ui-test', email: 'auth-ui@example.test', full_name: 'Integration User', email_verified: true };
const organizationId = '8cfb9258-dbd1-4b16-9c95-0178302eb10d';
const user = {
  id: 'teacher-ui-test', full_name: 'Integration User', email: account.email,
  phone: '+996555000000', role: 'TEACHER', organization_id: organizationId,
  organization_name: 'Integration Center', is_active: true,
};
const opaqueToken = 'v'.repeat(43);
const csrfToken = 'c'.repeat(43);

async function mockBrowserBoundary(page: Page, context: BrowserContext, baseURL: string) {
  await context.addCookies([{ name: 'auth_csrf', value: csrfToken, url: baseURL, httpOnly: true, sameSite: 'Lax' }]);
  await page.route('**/api/auth/csrf', route => route.fulfill({ json: { csrfToken } }));
  await page.route('**/api/auth/accounts/pending-invitation', route => route.fulfill({ json: { pending: false } }));
  await page.route('**/api/auth/accounts/me', route => route.fulfill({ status: 401, json: { code: 'UNAUTHENTICATED' } }));
}

function expectMutation(route: Route, body: unknown) {
  expect(route.request().method()).toBe('POST');
  expect(route.request().postDataJSON()).toEqual(body);
  expect(route.request().headers()['x-csrf-token']).toBe(csrfToken);
  expect(route.request().headers()['x-auth-bff-secret']).toBeUndefined();
  expect(route.request().headers().authorization).toBeUndefined();
}

async function installAccount(context: BrowserContext, baseURL: string) {
  await context.addCookies([{ name: 'account_session', value: opaqueToken, url: baseURL, httpOnly: true, sameSite: 'Lax' }]);
}

async function tenantToken(role = user.role) {
  return new SignJWT({ sub: user.id, role, organization_id: organizationId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || 'playwright-ui-fixture-only'));
}

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', url: baseURL! }]);
});

test.describe('account pages — mocked BFF wiring', () => {
  test('email login opens account onboarding before a center can open the dashboard', async ({ page, context, baseURL }) => {
    await mockBrowserBoundary(page, context, baseURL!);
    await page.addInitScript(previous => {
      if (!localStorage.getItem('auth-storage')) {
        localStorage.setItem('auth-storage', JSON.stringify({ state: { user: previous, isAuthenticated: true }, version: 0 }));
      }
    }, { ...user, id: 'previous-tenant-user', role: 'ADMIN', organization_id: 'previous-center' });
    await page.route('**/api/auth/accounts/login', async route => {
      expectMutation(route, { email: account.email, password: 'example-password-123' });
      await installAccount(context, baseURL!);
      await route.fulfill({ json: { account } });
    });
    await page.route('**/api/auth/accounts/me', route => route.fulfill({ json: {
      account, memberships: [{ organization_id: organizationId, role: user.role, organization: { name: user.organization_name, status: 'ACTIVE' } }], onboardingRequired: false,
    } }));
    let selectCalls = 0;
    const jwt = await tenantToken();
    await page.route('**/api/auth/accounts/select-organization', async route => {
      selectCalls++;
      expectMutation(route, { organization_id: organizationId });
      await context.addCookies([
        { name: 'access_token', value: jwt, url: baseURL!, httpOnly: true, sameSite: 'Lax' },
        { name: 'refresh_token', value: 'fixture-refresh-token', url: baseURL!, httpOnly: true, sameSite: 'Lax' },
      ]);
      await route.fulfill({ json: { user } });
    });
    await page.route('**/api/auth/me', route => route.fulfill({ json: { user } }));
    await page.route('**/api/proxy/**', route => route.fulfill({ json: [] }));

    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill('example-password-123');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.getByRole('heading', { name: 'Choose your center' })).toBeVisible();
    expect(selectCalls).toBe(0);
    expect((await context.cookies()).some(cookie => /^(access_token|refresh_token)$/.test(cookie.name))).toBe(false);
    expect(await page.evaluate(() => document.cookie)).not.toContain('account_session');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('auth-storage')!).state)).toMatchObject({ user: null, isAuthenticated: false });

    await page.getByRole('button', { name: `Open dashboard: ${user.organization_name}` }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading').filter({ hasText: 'Integration' }).first()).toBeVisible();
    expect(selectCalls).toBe(1);
    const visibleCredentials = await page.evaluate(() => ({ cookies: document.cookie, storage: JSON.stringify({ ...localStorage }) }));
    for (const credential of [opaqueToken, jwt, 'fixture-refresh-token']) {
      expect(visibleCredentials.cookies).not.toContain(credential);
      expect(visibleCredentials.storage).not.toContain(credential);
    }
  });

  test('account login failures stay on the form without triggering tenant refresh', async ({ page, context, baseURL }) => {
    await mockBrowserBoundary(page, context, baseURL!);
    let refreshCalls = 0;
    await page.route('**/api/auth/refresh', route => { refreshCalls++; return route.fulfill({ status: 401, json: {} }); });
    await page.route('**/api/auth/accounts/login', route => {
      expectMutation(route, { email: account.email, password: 'incorrect-password' });
      return route.fulfill({ status: 401, json: { code: 'UNAUTHENTICATED', message: 'Check your credentials.' } });
    });
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill('incorrect-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.locator('form [role="alert"]')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    expect(refreshCalls).toBe(0);
    expect((await context.cookies()).some(cookie => /^(account_session|access_token|refresh_token)$/.test(cookie.name))).toBe(false);
  });

  test('a backend with account auth disabled still offers the existing phone login', async ({ page, context, baseURL }) => {
    await mockBrowserBoundary(page, context, baseURL!);
    await page.route('**/api/auth/accounts/login', route => route.fulfill({ status: 404, json: { code: 'ACCOUNT_AUTH_DISABLED' } }));
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill('example-password-123');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.locator('form [role="alert"]')).toContainText('You can still use your center phone.');
    await page.getByRole('group', { name: 'Choose how you would like to continue.' }).getByRole('button', { name: 'Phone', exact: true }).click();
    await expect(page.getByLabel('Phone', { exact: true })).toBeEnabled();
    await expect(page.locator('form [role="alert"]')).toHaveCount(0);
  });

  test('registration submits only approved fields and displays generic delivery guidance', async ({ page, context, baseURL }) => {
    await mockBrowserBoundary(page, context, baseURL!);
    let calls = 0;
    await page.route('**/api/auth/accounts/register', route => {
      calls++;
      expectMutation(route, { email: account.email, full_name: account.full_name, password: 'example-password-123' });
      return route.fulfill({ json: { message: 'If eligible, check your email for the next step.' } });
    });
    await page.goto('/register');
    await page.getByLabel('Full name', { exact: true }).fill(account.full_name);
    await page.getByLabel('Email', { exact: true }).fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill('example-password-123');
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await expect(page.getByRole('status')).toBeVisible();
    expect(calls).toBe(1);
    expect((await context.cookies()).some(cookie => cookie.name === 'account_session')).toBe(false);
  });

  test('email verification removes its fragment and waits for an explicit action', async ({ page, context, baseURL }) => {
    await mockBrowserBoundary(page, context, baseURL!);
    let calls = 0;
    await page.route('**/api/auth/accounts/verify-email', route => {
      calls++;
      expectMutation(route, { token: opaqueToken });
      return route.fulfill({ json: { verified: true } });
    });
    await page.goto(`/verify-email#token=${opaqueToken}`);
    await expect(page).toHaveURL(/\/verify-email$/);
    const verify = page.getByRole('button', { name: 'Verify email', exact: true });
    await expect(verify).toBeEnabled();
    expect(calls).toBe(0);
    await verify.click();
    await expect(page.getByRole('status')).toBeVisible();
    expect(calls).toBe(1);
    expect((await context.cookies()).some(cookie => /^(account_session|access_token|refresh_token)$/.test(cookie.name))).toBe(false);
  });

  test('password recovery and reset require form submission and never consume links on navigation', async ({ page, context, baseURL }) => {
    await mockBrowserBoundary(page, context, baseURL!);
    let forgotCalls = 0;
    let resetCalls = 0;
    await page.route('**/api/auth/accounts/forgot-password', route => {
      forgotCalls++;
      expectMutation(route, { email: account.email });
      return route.fulfill({ json: { message: 'If eligible, check your email for the next step.' } });
    });
    await page.route('**/api/auth/accounts/reset-password', route => {
      resetCalls++;
      expectMutation(route, { token: opaqueToken, password: 'replacement-password-123' });
      return route.fulfill({ json: { success: true } });
    });
    await page.goto('/forgot-password');
    await page.getByLabel('Email', { exact: true }).fill(account.email);
    expect(forgotCalls).toBe(0);
    await page.getByRole('button', { name: 'Send reset link', exact: true }).click();
    await expect(page.getByRole('status')).toBeVisible();
    expect(forgotCalls).toBe(1);

    await page.goto(`/reset-password#token=${opaqueToken}`);
    await expect(page).toHaveURL(/\/reset-password$/);
    await page.getByLabel('Password', { exact: true }).fill('replacement-password-123');
    expect(resetCalls).toBe(0);
    await page.getByRole('button', { name: 'Save password', exact: true }).click();
    await expect(page.getByRole('status')).toBeVisible();
    expect(resetCalls).toBe(1);
  });

  test('Google sign-in starts at the BFF and only then leaves for Google', async ({ page, context, baseURL }) => {
    await mockBrowserBoundary(page, context, baseURL!);
    let calls = 0;
    await page.route('**/api/auth/accounts/google/start', route => {
      calls++;
      expectMutation(route, {});
      return route.fulfill({ json: { authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=ui-fixture' } });
    });
    await page.route('https://accounts.google.com/**', route => route.fulfill({ contentType: 'text/html', body: '<p>Google provider fixture</p>' }));
    await page.goto('/login');
    expect(calls).toBe(0);
    await page.getByRole('button', { name: 'Continue with Google' }).click();
    await expect(page).toHaveURL(/^https:\/\/accounts\.google\.com\//);
    expect(calls).toBe(1);
  });

  test('invitation is not accepted on GET and stays pending across sign-in', async ({ page, context, baseURL }) => {
    await mockBrowserBoundary(page, context, baseURL!);
    let pendingCalls = 0;
    let acceptCalls = 0;
    await page.route('**/api/auth/accounts/pending-invitation', route => {
      if (route.request().method() === 'POST') {
        pendingCalls++;
        expectMutation(route, { token: opaqueToken });
      }
      return route.fulfill({ json: { pending: pendingCalls > 0 } });
    });
    await page.route('**/api/auth/accounts/accept-invitation', route => {
      acceptCalls++;
      return route.fulfill({ json: { organization_id: organizationId } });
    });
    await page.goto(`/accept-invitation#token=${opaqueToken}`);
    await expect(page).toHaveURL(/\/accept-invitation$/);
    const signIn = page.getByRole('button', { name: 'Sign in to accept', exact: true });
    await expect(signIn).toBeVisible();
    expect(pendingCalls).toBe(0);
    expect(acceptCalls).toBe(0);
    await signIn.click();
    await expect(page).toHaveURL(/\/login\?next=(%2F|\/)accept-invitation/);
    expect(pendingCalls).toBe(1);
    expect(acceptCalls).toBe(0);
    expect(await page.evaluate(() => JSON.stringify({ ...localStorage })) ).not.toContain(opaqueToken);
  });

  test('center creation and legacy membership linking do not issue tenant sessions automatically', async ({ page, context, baseURL }) => {
    await mockBrowserBoundary(page, context, baseURL!);
    await installAccount(context, baseURL!);
    await page.route('**/api/auth/accounts/me', route => route.fulfill({ json: { account, memberships: [], onboardingRequired: true } }));
    let centerCalls = 0;
    let linkCalls = 0;
    await page.route('**/api/auth/accounts/centers', route => {
      centerCalls++;
      expectMutation(route, { name: 'New Education Center', phone: '+996555000000' });
      return route.fulfill({ json: { organization_id: organizationId } });
    });
    await page.route('**/api/auth/accounts/link-legacy', route => {
      linkCalls++;
      expectMutation(route, { phone: '+996555000000', password: 'legacy-password' });
      return route.fulfill({ json: { linked: true } });
    });
    await page.goto('/onboarding/create-center');
    await page.getByLabel('Center name', { exact: true }).fill('New Education Center');
    await page.getByLabel('Phone', { exact: true }).fill('555000000');
    await page.getByRole('button', { name: 'Create center', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('Your center is ready. Select it to open the dashboard.');
    expect(centerCalls).toBe(1);
    await expect(page).toHaveURL(/\/onboarding\/create-center$/);

    await page.goto('/onboarding/link-membership');
    await page.getByLabel('Phone', { exact: true }).fill('555000000');
    await page.getByLabel('Password', { exact: true }).fill('legacy-password');
    await page.getByRole('button', { name: 'Link membership', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('Membership linked. Choose your center.');
    expect(linkCalls).toBe(1);
    expect((await context.cookies()).some(cookie => /^(access_token|refresh_token)$/.test(cookie.name))).toBe(false);
  });

  test('a signed-in invitee explicitly accepts with a center phone before selecting a tenant', async ({ page, context, baseURL }) => {
    await mockBrowserBoundary(page, context, baseURL!);
    await installAccount(context, baseURL!);
    await page.route('**/api/auth/accounts/me', route => route.fulfill({ json: { account, memberships: [], onboardingRequired: true } }));
    let calls = 0;
    await page.route('**/api/auth/accounts/accept-invitation', route => {
      calls++;
      expectMutation(route, { token: opaqueToken, phone: '+996555000000' });
      return route.fulfill({ json: { organization_id: organizationId } });
    });
    await page.goto(`/accept-invitation#token=${opaqueToken}`);
    await expect(page).toHaveURL(/\/accept-invitation$/);
    await page.getByLabel('Phone', { exact: true }).fill('555000000');
    expect(calls).toBe(0);
    await page.getByRole('button', { name: 'Accept invitation', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('Invitation accepted. Choose your center.');
    expect(calls).toBe(1);
    expect((await context.cookies()).some(cookie => /^(access_token|refresh_token)$/.test(cookie.name))).toBe(false);
  });

  test('an administrator sends an email invitation through the tenant-authenticated BFF', async ({ page, context, baseURL }) => {
    test.skip(!process.env.JWT_ACCESS_SECRET, 'JWT_ACCESS_SECRET must match the local server for role-gated navigation');
    await mockBrowserBoundary(page, context, baseURL!);
    await context.addCookies([{ name: 'access_token', value: await tenantToken('ADMIN'), url: baseURL!, httpOnly: true, sameSite: 'Lax' }]);
    await page.route('**/api/auth/me', route => route.fulfill({ json: { user: { ...user, role: 'ADMIN' } } }));
    await page.route('**/api/proxy/**', route => route.fulfill({ json: [] }));
    let calls = 0;
    await page.route('**/api/auth/accounts/invitations', route => {
      calls++;
      expectMutation(route, { email: 'new-teacher@example.test', role: 'TEACHER' });
      return route.fulfill({ json: { invitation_id: 'invitation-ui-test', expires_at: new Date(Date.now() + 7 * 86400_000).toISOString() } });
    });
    await page.goto('/invitations');
    await page.locator('#invitation-email').fill('new-teacher@example.test');
    await page.getByRole('button', { name: 'Send invitation', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'new-teacher@example.test' })).toBeVisible();
    expect(calls).toBe(1);
  });

  test('registration and token forms fit a mobile viewport', async ({ page, context, baseURL }) => {
    await mockBrowserBoundary(page, context, baseURL!);
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ['/register', `/verify-email#token=${opaqueToken}`, `/reset-password#token=${opaqueToken}`]) {
      await page.goto(path);
      await expect(page.getByRole('heading').last()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
});

test.describe('real BFF local security boundary', () => {
  test('account-only cookie cannot open tenant dashboard and anonymous onboarding requires login', async ({ request, baseURL }) => {
    const anonymous = await request.get('/onboarding', { maxRedirects: 0 });
    expect(anonymous.status()).toBe(307);
    expect(anonymous.headers().location).toContain('/login');
    const accountOnly = await request.get('/dashboard', { headers: { Cookie: `account_session=${opaqueToken}` }, maxRedirects: 0 });
    expect(accountOnly.status()).toBe(307);
    expect(new URL(accountOnly.headers().location, baseURL!).pathname).toBe('/onboarding');
  });

  test('cross-site mutations cannot set pending invitations or call login', async ({ request }) => {
    for (const path of ['/api/auth/accounts/pending-invitation', '/api/auth/accounts/login', '/api/auth/login']) {
      const response = await request.post(path, {
        headers: { Origin: 'https://attacker.example', Cookie: `auth_csrf=${csrfToken}`, 'X-CSRF-Token': csrfToken },
        data: path.endsWith('pending-invitation') ? { token: opaqueToken } : {},
      });
      expect(response.status()).toBe(403);
      expect(response.headers()['cache-control']).toContain('no-store');
      expect(response.headers()['set-cookie'] ?? '').not.toContain('auth_invitation');
    }
  });

  test('an account cookie cannot authorize tenant writes or bypass the account BFF', async ({ request }) => {
    const tenantWrite = await request.post('/api/ai/actions', {
      headers: { Cookie: `account_session=${opaqueToken}` },
      data: { action: 'record_payment', payload: { student_id: 'fixture', amount: 1, method: 'CASH' } },
      maxRedirects: 0,
    });
    expect(tenantWrite.status()).toBe(401);
    expect(tenantWrite.headers()['content-type']).toContain('application/json');
    const proxyBypass = await request.get('/api/proxy/auth/accounts/me', {
      headers: { Cookie: `account_session=${opaqueToken}` }, maxRedirects: 0,
    });
    expect(proxyBypass.status()).toBe(404);
  });

  test('encoded proxy paths cannot expose a second authentication endpoint', async ({ request }) => {
    for (const [path, status] of [
      ['/api/proxy/%61uth/login', 404],
      ['/api/proxy/%2561uth/login', 400],
      ['/api/proxy/auth%2flogin', 404],
      ['/api/proxy/unrelated/%2e%2e/auth/login', 404],
    ] as const) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), path).toBe(status);
    }
  });

  test('a tenant session can still reach account sign-in when accepting an invitation', async ({ request }) => {
    const response = await request.get('/login?next=/accept-invitation', {
      headers: { Cookie: `access_token=${await tenantToken()}` }, maxRedirects: 0,
    });
    expect(response.status()).toBe(200);
    expect(response.headers().location).toBeUndefined();
  });

  test('an existing tenant session can see Google account-linking errors on the sign-in page', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'access_token', value: await tenantToken(), url: baseURL!, httpOnly: true, sameSite: 'Lax' }]);
    const response = await page.goto('/login?auth_error=identity_conflict');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/login\?auth_error=identity_conflict$/);
    await expect(page.locator('[role="alert"]').filter({ hasText: 'This email or phone is already linked.' })).toBeVisible();
  });

  test('Google callback without a browser binding redirects with a fixed error and no credentials', async ({ request }) => {
    const response = await request.get(`/api/auth/google/callback?code=fixture-sensitive-code&state=${opaqueToken}`, { maxRedirects: 0 });
    expect(response.status()).toBe(303);
    expect(new URL(response.headers().location).pathname).toBe('/login');
    expect(new URL(response.headers().location).search).toBe('?auth_error=invalid_callback');
    expect(response.headers()['cache-control']).toContain('no-store');
    expect(response.headers()['referrer-policy']).toBe('no-referrer');
    expect(response.headers()['set-cookie'] ?? '').not.toContain('account_session=');
  });

  test('pending invitation is HttpOnly and exposes only presence to browser JavaScript', async ({ page, baseURL }) => {
    await page.goto('/login');
    const result = await page.evaluate(async token => {
      const csrf = await fetch('/api/auth/csrf').then(response => response.json());
      const response = await fetch('/api/auth/accounts/pending-invitation', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf.csrfToken }, body: JSON.stringify({ token }),
      });
      return { status: response.status, body: await response.json(), cookies: document.cookie, cache: response.headers.get('cache-control') };
    }, opaqueToken);
    expect(result).toEqual({ status: 200, body: { pending: true }, cookies: expect.not.stringContaining(opaqueToken), cache: 'no-store' });
    const cookies = await page.context().cookies(baseURL!);
    const pending = cookies.find(cookie => cookie.name === 'auth_invitation');
    expect(pending).toMatchObject({ value: opaqueToken, httpOnly: true, secure: true, sameSite: 'Lax' });
    const presence = await page.evaluate(async () => fetch('/api/auth/accounts/pending-invitation').then(response => response.json()));
    expect(presence).toEqual({ pending: true });
  });
});
