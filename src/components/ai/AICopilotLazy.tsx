'use client';

import dynamic from 'next/dynamic';

/**
 * Client-only lazy wrapper for AICopilot.
 *
 * Why: AICopilot pulls in @ai-sdk/react and chat infrastructure (~80KB+),
 * but most users never open it. Loading it on-demand keeps the dashboard
 * initial bundle smaller. ssr:false skips server render — safe because
 * the floating button has no SEO value.
 */
export const AICopilot = dynamic(
  () => import('./AICopilot').then((m) => m.AICopilot),
  { ssr: false },
);
