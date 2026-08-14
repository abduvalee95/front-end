import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Constant-time check of the `x-admin-secret` header.
 *
 * `a !== b` on strings returns as soon as two bytes differ, so the time it
 * takes to reject a guess leaks how much of the prefix was right. That is
 * enough to recover a secret byte by byte given enough attempts, and the
 * workflow endpoints this guards have no rate limit in front of them.
 *
 * Both sides are hashed before comparing because timingSafeEqual throws on
 * length mismatch — comparing digests keeps the buffers the same size, so the
 * length of the real secret does not leak either.
 */
export function isValidAdminSecret(provided: string | null | undefined): boolean {
  const expected = process.env.ADMIN_SECRET;

  // Fail closed. An unset secret must never mean "everyone is an admin", which
  // is what a bare `provided !== expected` would allow the moment a caller
  // managed to send an undefined-ish value.
  if (!expected) return false;
  if (!provided) return false;

  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();

  return timingSafeEqual(a, b);
}
