/**
 * Fixed-window rate limiter, held in the process's own memory.
 *
 * READ THIS BEFORE RELYING ON IT. The counters live in a Map inside one Node
 * process. On a serverless platform every warm instance keeps its own Map, so
 * the real ceiling is `limit x number of instances`, and a cold start resets a
 * caller's count to zero. That makes this a cost brake, not an access control:
 * it stops a loop in a browser tab or a naive script from burning an LLM quota,
 * and it does not stop a determined attacker who can spread requests across
 * instances.
 *
 * The honest fix is a shared store (Redis, or the platform's own KV) keyed the
 * same way, which is already on the backlog. Until that exists, this is
 * deliberately the simplest thing that reduces the blast radius without adding
 * infrastructure — and the limits below are set low enough that per-instance
 * multiplication still lands somewhere survivable.
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Requests left in the current window. */
  remaining: number;
  /** Epoch ms at which the window rolls over. */
  resetAt: number;
  /** Whole seconds until reset, for the Retry-After header. */
  retryAfterSeconds: number;
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface Counter {
  count: number;
  resetAt: number;
}

/**
 * Buckets are namespaced per endpoint so a chat limit and an action limit
 * never share a counter for the same user.
 */
const buckets = new Map<string, Map<string, Counter>>();

/**
 * An unbounded Map is a memory leak with a slow fuse: every distinct key ever
 * seen would be retained for the life of the process. Expired entries are swept
 * once a bucket grows past this, which is cheap because it only runs on the
 * rare write that crosses the threshold.
 */
const SWEEP_THRESHOLD = 5_000;

function sweep(bucket: Map<string, Counter>, now: number): void {
  for (const [key, counter] of bucket) {
    if (counter.resetAt <= now) bucket.delete(key);
  }
}

export function rateLimit(
  namespace: string,
  key: string,
  { limit, windowMs }: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();

  let bucket = buckets.get(namespace);
  if (!bucket) {
    bucket = new Map();
    buckets.set(namespace, bucket);
  }

  if (bucket.size > SWEEP_THRESHOLD) sweep(bucket, now);

  const existing = bucket.get(key);

  // No counter, or the previous window has already rolled over.
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    bucket.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  if (existing.count >= limit) {
    // Not incremented past the limit: a caller hammering the endpoint should
    // not push their own reset further away than the window they started.
    return { allowed: false, remaining: 0, resetAt: existing.resetAt, retryAfterSeconds };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
    retryAfterSeconds,
  };
}

/** Standard headers so a client can back off instead of guessing. */
export function rateLimitHeaders(limit: number, result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed ? {} : { 'Retry-After': String(result.retryAfterSeconds) }),
  };
}

/** Test-only: drops all counters so specs do not leak state into each other. */
export function __resetRateLimits(): void {
  buckets.clear();
}
