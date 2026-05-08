const isDev = process.env.NODE_ENV !== 'production';

/**
 * Client-side logger — debug/info are suppressed in production.
 */
export const logger = {
  debug: (...args: unknown[]) => { if (isDev) console.log('[DEBUG]', ...args); },
  info: (...args: unknown[]) => { if (isDev) console.info('[INFO]', ...args); },
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
};

/**
 * Server-side logger for API routes — same interface, always prefixed.
 * debug/info suppressed in production.
 */
export const serverLogger = {
  debug: (...args: unknown[]) => { if (isDev) console.log('[SERVER:DEBUG]', ...args); },
  info: (...args: unknown[]) => { if (isDev) console.info('[SERVER:INFO]', ...args); },
  warn: (...args: unknown[]) => console.warn('[SERVER:WARN]', ...args),
  error: (...args: unknown[]) => console.error('[SERVER:ERROR]', ...args),
};
