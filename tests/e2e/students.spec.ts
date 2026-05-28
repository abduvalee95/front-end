import { test, expect } from '@playwright/test';
import { login } from './_helpers/login';

test.describe('Students page', () => {
  test('renders student list or empty state (no Access Denied)', async ({ page }) => {
    await login(page);
    await page.goto('/students');

    // Wait for the page to finish loading (loading skeleton disappears)
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Page must NOT show an access-denied panel
    await expect(page.locator('text=/Access Denied|Доступ запрещён/i')).toHaveCount(0);

    // The student list workspace should be present: either a data table,
    // a "0 students" counter, or an empty-state notice.
    // Covers: tanstack table, role=table, or any empty-state text in any locale.
    const table = page.locator('table, [role="table"]');
    const studentCounter = page.locator('text=/O\'quvchilar|Студенты|Students/i').first();
    const emptyNotice = page.locator('text=/hali|yo\'q|no students|нет студентов/i').first();

    const [hasTable, hasCounter, hasEmpty] = await Promise.all([
      table.count().then((c) => c > 0),
      studentCounter.isVisible().catch(() => false),
      emptyNotice.isVisible().catch(() => false),
    ]);

    expect(
      hasTable || hasCounter || hasEmpty,
      'Expected student list workspace (table, counter, or empty-state)',
    ).toBeTruthy();
  });
});
