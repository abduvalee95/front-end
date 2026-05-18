# Production Build Fix — Design Spec

Date: 2026-05-18  
Scope: Approach A — minimal fix to unblock Vercel deploy  
Branch strategy: develop → main (separate branches, main = production)

## Problem

Build currently fails with:
1. TypeScript error: `attendance/page.tsx` uses `<Button asChild>` but the `Button` component uses `@base-ui/react/button` which has no `asChild` prop.
2. `next@16.2.4` has known high-severity CVE (latest patch: `16.2.6`).
3. Middleware deprecation warning: `src/middleware.ts` should be renamed to `src/proxy.ts` per Next.js 16 convention.

## Out of Scope

- `xlsx` package replacement (user decision: keep as-is)
- ESLint strict setup, testing, CI/CD, Sentry, bundle optimization

## Changes

### 1. Fix attendance/page.tsx

`@base-ui/react/button` does not support the Radix `asChild` pattern. The Button in `src/components/ui/button.tsx` wraps `ButtonPrimitive` from `@base-ui/react` — no `Slot` integration.

**Fix:** Replace `<Button asChild><Link ...>text</Link></Button>` with a `Link` that uses `buttonVariants()` for styling. This is semantically correct (anchor element for navigation, not a button).

```tsx
// Before
<Button asChild>
  <Link href="/journal">Jurnalga o'tish</Link>
</Button>

// After
import { buttonVariants } from '@/components/ui/button';
<Link href="/journal" className={buttonVariants()}>Jurnalga o'tish</Link>
```

### 2. Update next to 16.2.6

`npm install next@16.2.6` — patch update, no breaking changes.  
`undici` (bundled in next) will also be updated, resolving that CVE.

### 3. Rename middleware → proxy

Per Next.js 16 docs, `src/middleware.ts` → `src/proxy.ts`. The export signature and `config` matcher stay the same.

## Success Criteria

- `npm run build` exits with code 0, no TypeScript errors
- No high-severity CVEs in `next` or `undici`
- No deprecation warning for middleware file convention
- Vercel deploy succeeds on main branch
