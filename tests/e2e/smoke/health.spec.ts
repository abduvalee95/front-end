import { test, expect } from '@playwright/test';

const BACKEND_URL =
  process.env.E2E_BACKEND_URL ?? 'https://back-end-theta-two.vercel.app';

test.describe('Backend health', () => {
  test('GET /api/health returns 200 with status ok', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/health`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
  });
});
