import type { Page } from '@playwright/test';

const DEFAULT_PHONE = process.env.E2E_PHONE ?? '+996559147444';
const DEFAULT_PASSWORD = process.env.E2E_PASSWORD ?? 'StrongPassword123';

/**
 * Logs in via the /login page and waits for the post-auth redirect.
 * SUPER_ADMIN lands on /admin/dashboard; regular users on /dashboard.
 */
export async function login(
  page: Page,
  phone = DEFAULT_PHONE,
  password = DEFAULT_PASSWORD,
): Promise<void> {
  await page.goto('/login');
  await page.locator('#phone').fill(phone);
  await page.locator('#password').fill(password);
  await page.locator('button[type="submit"]').click();

  // Wait for redirect to either dashboard variant
  await page.waitForURL(/\/(admin\/)?dashboard/, { timeout: 15_000 });
}
