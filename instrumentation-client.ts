import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.1,
  integrations: [Sentry.replayIntegration()],
  // Sentry stays fully silent / no-op when DSN is absent
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});

// Required by @sentry/nextjs to instrument client-side navigations
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
