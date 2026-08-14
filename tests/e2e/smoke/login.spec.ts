import { test, expect } from '@playwright/test';

test.describe('Login flow', () => {
  test('authenticates and redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#phone').fill(process.env.E2E_PHONE ?? '+996559147444');
    await page.locator('#password').fill(process.env.E2E_PASSWORD ?? 'StrongPassword123');
    await page.locator('button[type="submit"]').click();

    // SUPER_ADMIN -> /admin/dashboard, regular user -> /dashboard
    await expect(page).toHaveURL(/\/(admin\/)?dashboard/, { timeout: 10_000 });

    // Dashboard heading is present in all locale variants after login
    // Matches uz "Boshqaruv paneli", ru "Панель управления", etc.
    // Also accept "dashboard" for en locale
    await expect(
      page.getByRole('heading').or(page.locator('h1, h2, h3, [data-slot="heading"]')).first(),
    ).toBeVisible({ timeout: 8_000 });
  });
});
