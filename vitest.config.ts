import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Unit tests for the pure logic the app's safety rests on — route permissions,
 * token verification, message normalisation, the AI action allowlist, the admin
 * secret comparison, the rate limiter.
 *
 * These are deliberately separate from tests/e2e: Playwright needs a built app
 * and a running server, which is too slow a loop for functions that are just
 * input in, decision out. `tests/e2e` is excluded here so `vitest` does not try
 * to run Playwright specs.
 */
export default defineConfig({
  test: {
    // Node by default: most of what is tested here is server logic, and jsdom's
    // TextEncoder returns a Uint8Array from another realm, which jose rejects
    // outright. The one DOM test opts in with a `@vitest-environment jsdom`
    // docblock.
    environment: 'node',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    restoreMocks: true,
  },
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
