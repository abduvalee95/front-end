import { withSentryConfig } from '@sentry/nextjs';
import { withWorkflow } from 'workflow/next';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

// NOTE: Set SENTRY_ORG, SENTRY_PROJECT, and SENTRY_AUTH_TOKEN in Vercel env
// vars to enable source map upload. Without them the plugin skips upload.
// Source maps are hidden by default (no hideSourceMaps needed in v9+).
export default withSentryConfig(withWorkflow(nextConfig), {
  silent: true,
});
