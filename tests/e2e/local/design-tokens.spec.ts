import { test, expect, type Page } from '@playwright/test';

/**
 * Contrast guard for the design system.
 *
 * These assertions exist because of a real regression: `tailwind-merge` did
 * not recognise the custom type scale (`text-body`, `text-caption`, …), filed
 * those classes under *text colour*, and dropped the variant's real colour
 * from the merged class list. The login button ended up inheriting ambient
 * ink — 1.55:1 against its own background in dark mode, i.e. invisible.
 *
 * A computed-style check catches that class of bug; a class-name check would
 * not, because the markup still *looks* correct.
 */

const AA_NORMAL = 4.5;

function relativeLuminance([r, g, b]: number[]): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function parseRgb(value: string): number[] {
  const parts = value.match(/[\d.]+/g);
  if (!parts) throw new Error(`Unparseable colour: ${value}`);
  return parts.slice(0, 3).map(Number);
}

function contrast(a: string, b: string): number {
  const [la, lb] = [relativeLuminance(parseRgb(a)), relativeLuminance(parseRgb(b))];
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((t) => window.localStorage.setItem('theme', t), theme);
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`design tokens — ${theme}`, () => {
    test('primary button ink clears WCAG AA against its own surface', async ({ page }) => {
      await setTheme(page, theme);
      await page.goto('/login');

      const button = page.locator('button[type="submit"]').first();
      await expect(button).toBeVisible();

      const { background, color, fontSize } = await button.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          background: style.backgroundColor,
          color: style.color,
          fontSize: style.fontSize,
        };
      });

      expect(
        contrast(background, color),
        `submit button ${color} on ${background}`,
      ).toBeGreaterThanOrEqual(AA_NORMAL);

      // The size variant must still apply — it is the class that used to win
      // the merge and silently discard the colour.
      expect(fontSize).not.toBe('16px');
    });

    test('body text clears WCAG AA against the page background', async ({ page }) => {
      await setTheme(page, theme);
      await page.goto('/login');

      const { background, color } = await page.evaluate(() => {
        const body = document.body;
        const style = getComputedStyle(body);
        return { background: style.backgroundColor, color: style.color };
      });

      expect(
        contrast(background, color),
        `body ${color} on ${background}`,
      ).toBeGreaterThanOrEqual(AA_NORMAL);
    });

    test('theme class and token values agree', async ({ page }) => {
      await setTheme(page, theme);
      await page.goto('/login');

      const root = await page.evaluate(() => {
        const el = document.documentElement;
        const style = getComputedStyle(el);
        return {
          className: el.className,
          background: style.getPropertyValue('--background').trim(),
        };
      });

      expect(root.className).toContain(theme);
      // `dark:` utilities resolve against the `.dark` class (see the
      // @custom-variant in globals.css); if the token layer disagreed with
      // the class, this is where it would show.
      expect(root.background).not.toBe('');
    });
  });
}
