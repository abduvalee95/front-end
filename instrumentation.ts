import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');

    // Surface backend/secret misconfiguration at boot rather than leaving it
    // to show up as a failed login later.
    const [{ reportServerEnv }, { serverLogger }] = await Promise.all([
      import('./src/lib/server-env'),
      import('./src/lib/logger'),
    ]);
    reportServerEnv(serverLogger);
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Capture errors from Server Components, middleware, and edge proxies
export const onRequestError = Sentry.captureRequestError;
