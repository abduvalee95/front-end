import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { rateLimit, rateLimitHeaders, __resetRateLimits } from '@/lib/rate-limit';

/**
 * The rate limiter.
 *
 * Counters live in module state, so every test resets them first — otherwise
 * the suite passes once and then fails on a second run in the same process,
 * which is exactly the failure mode this file exists to prevent elsewhere.
 */
beforeEach(() => {
  __resetRateLimits();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const OPTS = { limit: 3, windowMs: 60_000 };

describe('rateLimit', () => {
  it('allows exactly the limit, then refuses', () => {
    const results = Array.from({ length: 5 }, () => rateLimit('t', 'user:1', OPTS));

    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false, false]);
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0, 0]);
  });

  it('counts each key separately', () => {
    rateLimit('t', 'user:1', OPTS);
    rateLimit('t', 'user:1', OPTS);
    rateLimit('t', 'user:1', OPTS);

    // One user exhausting their budget must not throttle anybody else.
    expect(rateLimit('t', 'user:1', OPTS).allowed).toBe(false);
    expect(rateLimit('t', 'user:2', OPTS).allowed).toBe(true);
  });

  it('counts each namespace separately', () => {
    for (let i = 0; i < 3; i += 1) rateLimit('chat', 'user:1', OPTS);

    expect(rateLimit('chat', 'user:1', OPTS).allowed).toBe(false);
    // Spending the chat budget must not lock the user out of confirming an action.
    expect(rateLimit('ai-actions', 'user:1', OPTS).allowed).toBe(true);
  });

  it('lets the window roll over', () => {
    for (let i = 0; i < 3; i += 1) rateLimit('t', 'user:1', OPTS);
    expect(rateLimit('t', 'user:1', OPTS).allowed).toBe(false);

    vi.advanceTimersByTime(60_001);

    const fresh = rateLimit('t', 'user:1', OPTS);
    expect(fresh.allowed).toBe(true);
    expect(fresh.remaining).toBe(2);
  });

  it('does not push the reset further away when a caller keeps hammering', () => {
    for (let i = 0; i < 3; i += 1) rateLimit('t', 'user:1', OPTS);
    const firstRefusal = rateLimit('t', 'user:1', OPTS);

    vi.advanceTimersByTime(30_000);
    const laterRefusal = rateLimit('t', 'user:1', OPTS);

    // A fixed window, not a rolling penalty: retrying must not extend the ban.
    expect(laterRefusal.resetAt).toBe(firstRefusal.resetAt);
    expect(laterRefusal.retryAfterSeconds).toBeLessThan(firstRefusal.retryAfterSeconds);
  });

  it('always reports at least one second to wait', () => {
    for (let i = 0; i < 3; i += 1) rateLimit('t', 'user:1', OPTS);
    vi.advanceTimersByTime(59_900);

    // Retry-After: 0 invites an immediate retry that is guaranteed to fail.
    expect(rateLimit('t', 'user:1', OPTS).retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });
});

describe('rateLimitHeaders', () => {
  it('omits Retry-After while the caller is still within budget', () => {
    const headers = rateLimitHeaders(3, rateLimit('t', 'user:1', OPTS));

    expect(headers['X-RateLimit-Limit']).toBe('3');
    expect(headers['X-RateLimit-Remaining']).toBe('2');
    expect(headers).not.toHaveProperty('Retry-After');
  });

  it('includes Retry-After on a refusal', () => {
    for (let i = 0; i < 3; i += 1) rateLimit('t', 'user:1', OPTS);
    const headers = rateLimitHeaders(3, rateLimit('t', 'user:1', OPTS));

    expect(headers['X-RateLimit-Remaining']).toBe('0');
    expect(Number(headers['Retry-After'])).toBeGreaterThan(0);
  });

  it('reports the reset as whole seconds', () => {
    const headers = rateLimitHeaders(3, rateLimit('t', 'user:1', OPTS));
    expect(headers['X-RateLimit-Reset']).toMatch(/^\d+$/);
  });
});
