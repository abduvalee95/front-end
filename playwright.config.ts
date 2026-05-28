import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration.
 * - Local: spins up `next start` via webServer (unless PLAYWRIGHT_SKIP_WEBSERVER=1)
 * - CI:    targets the already-deployed URL via E2E_BASE_URL env var
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // Only start a local server when not explicitly skipped (e.g. in CI against
  // a deployed URL, set PLAYWRIGHT_SKIP_WEBSERVER=1).
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'npm run build && npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
