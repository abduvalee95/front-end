import { withSentryConfig } from '@sentry/nextjs';
import { withWorkflow } from 'workflow/next';
import withBundleAnalyzerFactory from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

const withBundleAnalyzer = withBundleAnalyzerFactory({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // ─── Hardening ────────────────────────────────────────────────────────────
  poweredByHeader: false,

  // ─── Standalone output (required for Docker; Vercel ignores it) ───────────
  output: 'standalone',

  // ─── Image optimization ───────────────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Vercel-hosted backend (production)
      {
        protocol: 'https',
        hostname: 'back-end-theta-two.vercel.app',
        pathname: '/uploads/**',
      },
      // Railway-hosted backend (alternate / migration target)
      {
        protocol: 'https',
        hostname: 'bilimnuruback.up.railway.app',
        pathname: '/uploads/**',
      },
      // Local dev backend
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
    ],
  },

  // ─── Security headers ─────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            // Deny camera, mic, geolocation by default.
            // Expand individual directives if the app later requires access.
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            // 2-year max-age; only sent over HTTPS (browsers enforce this).
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // TODO: Add CSP when ready; requires nonce setup for Next.js inline scripts.
          // See: https://nextjs.org/docs/app/guides/content-security-policy
        ],
      },
    ];
  },
};

// NOTE: Set SENTRY_ORG, SENTRY_PROJECT, and SENTRY_AUTH_TOKEN in Vercel env
// vars to enable source map upload. Without them the plugin skips upload.
// Source maps are hidden by default (no hideSourceMaps needed in v9+).
//
// Wrapper order (innermost → outermost):
//   nextConfig → withBundleAnalyzer → withWorkflow → withSentryConfig
export default withSentryConfig(withWorkflow(withBundleAnalyzer(nextConfig)), {
  silent: true,
});
