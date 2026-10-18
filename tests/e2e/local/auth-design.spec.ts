import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'uz', url: baseURL! }]);
});

test('phone login submits normalized credentials and keeps failures on the form', async ({ page }) => {
  let refreshCalls = 0;
  await page.route('**/api/auth/refresh', route => { refreshCalls++; return route.fulfill({ status: 401, json: {} }); });
  await page.route('**/api/auth/login', route => {
    expect(route.request().postDataJSON()).toEqual({ phone: '+996555000000', password: 'example-password', remember_me: true });
    return route.fulfill({ status: 401, json: { message: 'Test: noto‘g‘ri parol' } });
  });
  await page.goto('/login#phone');
  await page.getByLabel('Telefon', { exact: true }).fill('555000000');
  await page.getByLabel('Parol', { exact: true }).fill('example-password');
  await page.getByLabel('Meni eslab qolish').check();
  await page.getByRole('button', { name: 'Parolni ko‘rsatish' }).click();
  await expect(page.getByLabel('Parol', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Kirish', exact: true }).click();
  await expect(page.locator('form [role="alert"]')).toHaveText('Kirish amalga oshmadi. Qayta urinib ko‘ring.');
  expect(refreshCalls).toBe(0);
  await expect(page).toHaveURL(/\/login#phone$/);
});

test('phone errors and recovery help are accessible without submitting', async ({ page }) => {
  await page.goto('/login#phone');
  await page.getByLabel('Telefon', { exact: true }).fill('abc');
  await page.getByLabel('Parol', { exact: true }).fill('example-password');
  await page.getByRole('button', { name: 'Kirish', exact: true }).click();
  await expect(page.getByLabel('Telefon', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Parolni unutdingizmi?' }).click();
  await expect(page.locator('#account-help')).toBeVisible();
});

test('design sandbox is unavailable by default', async ({ request }) => {
  test.skip(process.env.AUTH_DESIGN_PREVIEW === 'true', 'Preview is explicitly enabled for this run');
  const response = await request.get('/auth-preview', { maxRedirects: 0 });
  expect(response.status()).toBe(404);
});

test('preview registration and both onboarding choices never authenticate', async ({ page, context }) => {
  test.skip(process.env.AUTH_DESIGN_PREVIEW !== 'true', 'Set AUTH_DESIGN_PREVIEW=true for visual sandbox checks');
  const authRequests: string[] = [];
  page.on('request', request => { if (request.url().includes('/api/auth/')) authRequests.push(request.url()); });
  await page.goto('/auth-preview');
  await expect(page.getByText('Interaktiv dizayn ko‘rigi')).toBeVisible();
  await page.getByRole('navigation').getByRole('button', { name: 'Ro‘yxatdan o‘tish' }).click();
  await page.getByLabel('To‘liq ism').fill('Demo User');
  await page.getByLabel('Email', { exact: true }).fill('demo@example.com');
  await page.getByLabel('Parol', { exact: true }).fill('demo-password-123');
  await page.getByRole('button', { name: 'Hisob yaratish', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Emailni tasdiqlang' })).toBeVisible();
  await page.getByRole('button', { name: 'Demo: email tasdiqlandi' }).click();
  await page.getByRole('button', { name: 'Davom etish' }).click();
  await page.getByLabel('Markaz nomi').fill('Demo center');
  await page.getByLabel('Telefon', { exact: true }).fill('+996555000000');
  await page.getByRole('button', { name: 'Davom etish' }).click();
  await expect(page.getByRole('heading', { name: 'Dizayn oqimi yakunlandi' })).toBeVisible();
  await page.getByRole('button', { name: 'Boshidan ko‘rish' }).click();
  await page.getByRole('button', { name: 'Google orqali davom etish' }).click();
  await page.getByRole('radio', { name: /Taklif orqali/ }).check();
  await page.getByRole('button', { name: 'Davom etish' }).click();
  await expect(page.getByLabel('Taklif kodi')).toBeVisible();
  expect(authRequests).toEqual([]);
  expect((await context.cookies()).filter(c => /^(access_token|refresh_token)$/.test(c.name))).toEqual([]);
});

test('mobile login has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Hisobingizga kiring' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
