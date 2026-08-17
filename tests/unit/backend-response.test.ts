import { describe, expect, it } from 'vitest';
import { readJsonBody, messageFrom, isUsableToken } from '@/lib/auth/backend-response';

/**
 * Reading the backend's auth reply.
 *
 * These exist because of a real incident: API_URL was configured without a
 * scheme, every login threw upstream, and the login route — which parsed the
 * body before checking the status, inside one big try/catch — answered
 * "Internal server error during login". The message named the wrong service.
 * The cases below are the shapes a broken backend actually returns.
 */
describe('readJsonBody', () => {
  it('parses a JSON body', async () => {
    const res = new Response(JSON.stringify({ accessToken: 'a' }), { status: 200 });
    expect(await readJsonBody(res)).toEqual({ accessToken: 'a' });
  });

  it('returns null for an HTML error page instead of throwing', async () => {
    const res = new Response('<!DOCTYPE html><title>502 Bad Gateway</title>', { status: 502 });
    await expect(readJsonBody(res)).resolves.toBeNull();
  });

  it('returns null for an empty body instead of throwing', async () => {
    const res = new Response('', { status: 401 });
    await expect(readJsonBody(res)).resolves.toBeNull();
  });

  it('returns null for a truncated JSON body instead of throwing', async () => {
    const res = new Response('{"message":"nope"', { status: 500 });
    await expect(readJsonBody(res)).resolves.toBeNull();
  });
});

describe('messageFrom', () => {
  it('prefers the backend message', () => {
    expect(messageFrom({ message: 'Invalid phone or password' }, 'fallback')).toBe(
      'Invalid phone or password',
    );
  });

  it('falls back when the body is null, empty or not a string message', () => {
    expect(messageFrom(null, 'fallback')).toBe('fallback');
    expect(messageFrom({}, 'fallback')).toBe('fallback');
    expect(messageFrom({ message: '' }, 'fallback')).toBe('fallback');
    expect(messageFrom({ message: 42 }, 'fallback')).toBe('fallback');
    expect(messageFrom('a string body', 'fallback')).toBe('fallback');
  });
});

describe('isUsableToken', () => {
  it('accepts a non-empty string', () => {
    expect(isUsableToken('header.payload.signature')).toBe(true);
  });

  /**
   * The reason this guard exists: `cookies.set({ value: undefined })` stores
   * the literal string "undefined", which satisfies every `cookies.has()`
   * check in the middleware and fails every signature check after it.
   */
  it('rejects the values that would be written as the string "undefined"', () => {
    expect(isUsableToken(undefined)).toBe(false);
    expect(isUsableToken(null)).toBe(false);
    expect(isUsableToken('')).toBe(false);
    expect(isUsableToken(0)).toBe(false);
    expect(isUsableToken({})).toBe(false);
  });
});
