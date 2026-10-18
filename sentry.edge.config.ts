import * as Sentry from '@sentry/nextjs';
import { filterAuthBreadcrumb, filterAuthTelemetry } from './src/lib/auth/telemetry';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  beforeSend: filterAuthTelemetry,
  beforeSendTransaction: filterAuthTelemetry,
  beforeBreadcrumb: filterAuthBreadcrumb,
  // Sentry stays fully silent / no-op when DSN is absent
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
