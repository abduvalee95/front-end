import { afterEach, describe, expect, it } from 'vitest';
import { isValidAdminSecret } from '@/lib/auth/admin-secret';

/**
 * Admin secret comparison.
 *
 * Timing is not measurable honestly from a unit test — what is testable is the
 * behaviour around the comparison, and the fail-closed cases are the ones that
 * turn a guard into a doorway.
 */
const ORIGINAL = process.env.ADMIN_SECRET;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.ADMIN_SECRET;
  else process.env.ADMIN_SECRET = ORIGINAL;
});

describe('isValidAdminSecret', () => {
  it('accepts the exact secret', () => {
    process.env.ADMIN_SECRET = 'correct-horse-battery-staple';
    expect(isValidAdminSecret('correct-horse-battery-staple')).toBe(true);
  });

  it('rejects a wrong secret, including near misses', () => {
    process.env.ADMIN_SECRET = 'correct-horse-battery-staple';
    expect(isValidAdminSecret('correct-horse-battery-stapl')).toBe(false);
    expect(isValidAdminSecret('correct-horse-battery-staple ')).toBe(false);
    expect(isValidAdminSecret('Correct-horse-battery-staple')).toBe(false);
    expect(isValidAdminSecret('c')).toBe(false);
  });

  it('rejects everything when no secret is configured', () => {
    // An unset ADMIN_SECRET must never read as "no gate here". This is the
    // case a bare `provided !== process.env.ADMIN_SECRET` gets wrong the
    // moment anything undefined-ish reaches it.
    delete process.env.ADMIN_SECRET;
    expect(isValidAdminSecret('anything')).toBe(false);
    expect(isValidAdminSecret('')).toBe(false);
    expect(isValidAdminSecret(undefined)).toBe(false);
    expect(isValidAdminSecret(null)).toBe(false);
  });

  it('rejects an empty secret even when one is configured', () => {
    process.env.ADMIN_SECRET = 'set';
    expect(isValidAdminSecret('')).toBe(false);
    expect(isValidAdminSecret(null)).toBe(false);
    expect(isValidAdminSecret(undefined)).toBe(false);
  });

  it('does not throw on a length mismatch', () => {
    // timingSafeEqual throws on unequal buffer lengths; hashing first is what
    // keeps that from turning a wrong guess into a 500.
    process.env.ADMIN_SECRET = 'short';
    expect(() => isValidAdminSecret('a-considerably-longer-guess')).not.toThrow();
    expect(isValidAdminSecret('a-considerably-longer-guess')).toBe(false);
  });
});
