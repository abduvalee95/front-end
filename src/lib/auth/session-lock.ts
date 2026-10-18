'use client';

/** Tabs share HttpOnly cookies, so credential writes must share one origin-wide lock. */
export async function withSessionLock<T>(operation: () => Promise<T>): Promise<T> {
  if (typeof navigator === 'undefined' || !navigator.locks?.request) return operation();
  return navigator.locks.request('bilim-nuru-auth-session', { mode: 'exclusive' }, operation);
}
