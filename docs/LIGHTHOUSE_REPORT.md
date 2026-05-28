# Lighthouse Audit — 2026-05-28

URL audited: https://front-end-beige-zeta.vercel.app/  
Tool: Lighthouse 12.8.2 (npm)

## Scores

| Category       | Mobile | Desktop |
|----------------|-------:|--------:|
| Performance    | **53** | **94**  |
| Accessibility  | 96     | n/a     |
| Best Practices | 100    | n/a     |
| SEO            | 91     | n/a     |

Mobile performance is the only category below 90 — it's where the work is.

## Core Web Vitals (lab)

| Metric                          | Mobile  | Desktop | Target  |
|---------------------------------|--------:|--------:|---------|
| Largest Contentful Paint (LCP)  | 4.0 s   | 0.7 s   | < 2.5 s |
| First Contentful Paint (FCP)    | 2.0 s   | 0.6 s   | < 1.8 s |
| Total Blocking Time (TBT)       | 1410 ms | 90 ms   | < 200 ms |
| Cumulative Layout Shift (CLS)   | 0       | 0       | < 0.1   |
| Speed Index                     | 8.4 s   | n/a     | < 3.4 s |

Mobile fails LCP, TBT, and SI hard. Desktop passes everything.

## Diagnostics

- 34 network requests on landing
- 16 scripts, 4 fonts, 2 stylesheets
- 1300 main-thread tasks; 13 over 10 ms, 4 over 25 ms, 3 over 50 ms, 2 over 100 ms
- Total bytes: 518 KB on desktop run
- Main document: 28 KB

## Top opportunities

1. **Reduce unused JavaScript** — ~440 ms saved. Dead code from heavy vendor bundles shipped to first paint. Likely candidates: AI SDK chunks, recharts, framer-motion, lucide-react full set, sentry browser bundle.
2. **Initial server response time** — ~180 ms savings. Vercel cold start; not much to do beyond reducing the function's import graph. Less critical.

## Recommended fixes (priority order)

### P1 — biggest wins on mobile

1. **Code-split the landing page from app shell.** The landing (`/`) currently pulls in the dashboard component tree via shared imports. Audit `src/components/landing/LandingPageClient.tsx` imports — ensure it does NOT pull anything from `src/components/dashboard/*`, `src/components/finance/*`, etc.
2. **Dynamic-import heavy modules** with `next/dynamic({ ssr: false })`:
   - `@/components/ai/AICopilot` (Groq SDK)
   - charts (`recharts`) in dashboard widgets
   - `jspdf` + `html2canvas-pro` (already lazy in receipt code — verify no other importer pulls them at top level)
   - `framer-motion` for non-critical animations
3. **Tree-shake lucide-react.** Import individual icons (`import { Check } from 'lucide-react'`) — confirm not using namespace imports that pull the full set.
4. **Defer Sentry browser bundle.** Sentry's client init should run in `instrumentation-client.ts` after hydration, not block FCP. Already the case — but verify the bundle isn't pulling everything.
5. **Avoid `@base-ui/react` if a primitive isn't needed.** ShadCN already covers most cases.

### P2 — diminishing returns

6. **Reduce font count.** 4 fonts is heavy. Drop one weight or one family. Pin font-display: swap (Next default).
7. **Preload LCP image.** Hero image (if any) should use `priority` on `<Image>`.
8. **Brotli compression** is on by default on Vercel — no action.

## How to re-run

```bash
npx lighthouse https://front-end-beige-zeta.vercel.app/ \
  --form-factor=mobile \
  --only-categories=performance,accessibility,seo,best-practices \
  --view
```

For desktop, add `--preset=desktop --form-factor=desktop`.

## Next steps

- Apply P1 fixes in a follow-up commit, then re-run Lighthouse to confirm mobile Performance → 75+.
- Wire up `@next/third-parties` or `@vercel/speed-insights` to track real-user Core Web Vitals (RUM) — lab data only tells half the story.
