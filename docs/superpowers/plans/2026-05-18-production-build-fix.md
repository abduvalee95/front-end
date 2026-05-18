# Production Build Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three blocking issues so `npm run build` succeeds and Vercel production deploy works.

**Architecture:** Three isolated surgical fixes — (1) swap `asChild` Button pattern for `Link` with `buttonVariants()` in a single page, (2) patch `next` to `16.2.6`, (3) rename `src/middleware.ts` → `src/proxy.ts` per Next.js 16 file convention.

**Tech Stack:** Next.js 16.2.6, React 19, TypeScript 5, `@base-ui/react`, `class-variance-authority`

---

### Task 1: Fix TypeScript error — attendance/page.tsx

**Files:**
- Modify: `src/app/(dashboard)/attendance/page.tsx`

**Context:** `Button` in this project wraps `@base-ui/react/button`, which does NOT support Radix-style `asChild`. Using `asChild` causes a TypeScript type error that fails the build. The correct pattern is to use `buttonVariants()` directly on a `<Link>` element.

- [ ] **Step 1: Apply fix**

Replace the import and JSX in `src/app/(dashboard)/attendance/page.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { ClipboardCheck } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export default function AttendancePage() {
  return (
    <div className="max-w-xl mx-auto mt-20 text-center space-y-4">
      <div className="inline-flex h-16 w-16 rounded-2xl bg-muted items-center justify-center">
        <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold">Davomat</h1>
      <p className="text-sm text-muted-foreground">
        Davomatni hozircha jurnal sahifasida ko&apos;rishingiz mumkin. Alohida davomat
        sahifasi keyinroq ishga tushiriladi.
      </p>
      <Link href="/journal" className={buttonVariants()}>
        Jurnalga o&apos;tish
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/leo/Desktop/front-end
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
cd /Users/leo/Desktop/front-end
git add src/app/\(dashboard\)/attendance/page.tsx
git commit -m "fix: replace asChild Button with buttonVariants Link in attendance page"
```

---

### Task 2: Update next to 16.2.6

**Files:**
- Modify: `package.json`, `package-lock.json`

**Context:** `next@16.2.4` has a known high-severity CVE. `16.2.6` is the latest stable patch. `undici` (bundled in next) is also updated by this change.

- [ ] **Step 1: Install updated next**

```bash
cd /Users/leo/Desktop/front-end
npm install next@16.2.6
```

Expected output includes: `added X packages` or `changed X packages`. No errors.

- [ ] **Step 2: Verify version**

```bash
node -e "console.log(require('./node_modules/next/package.json').version)"
```

Expected: `16.2.6`

- [ ] **Step 3: Verify build still compiles**

```bash
npm run build 2>&1 | grep -E "(error|Error|✓|Failed)" | head -20
```

Expected: `✓ Compiled successfully` line, no `Failed` or `Type error` lines.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: update next to 16.2.6 to patch CVE"
```

---

### Task 3: Rename middleware.ts → proxy.ts

**Files:**
- Delete: `src/middleware.ts`
- Create: `src/proxy.ts` (same content)

**Context:** Next.js 16 deprecates the `middleware` filename convention in favour of `proxy`. The warning is: `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` The export signature and `config` matcher are unchanged — only the filename changes.

- [ ] **Step 1: Copy file with new name**

```bash
cp /Users/leo/Desktop/front-end/src/middleware.ts /Users/leo/Desktop/front-end/src/proxy.ts
```

- [ ] **Step 2: Delete old file**

```bash
rm /Users/leo/Desktop/front-end/src/middleware.ts
```

- [ ] **Step 3: Run build and confirm warning is gone**

```bash
cd /Users/leo/Desktop/front-end
npm run build 2>&1 | grep -i "middleware"
```

Expected: no output (warning gone).

- [ ] **Step 4: Confirm build succeeds**

```bash
npm run build 2>&1 | tail -10
```

Expected: lines including `✓ Compiled successfully` and exit code 0. No `Type error` or `Failed` lines.

- [ ] **Step 5: Commit**

```bash
git add src/proxy.ts
git rm src/middleware.ts
git commit -m "fix: rename middleware.ts to proxy.ts per Next.js 16 convention"
```

---

### Task 4: Final verification

- [ ] **Step 1: Clean build from scratch**

```bash
cd /Users/leo/Desktop/front-end
rm -rf .next
npm run build 2>&1
```

Expected: process exits 0, output contains `✓ Compiled successfully`, no TypeScript errors, no middleware deprecation warning.

- [ ] **Step 2: Check no new high CVEs**

```bash
npm audit --audit-level=high 2>&1 | tail -10
```

Expected: either `found 0 vulnerabilities` or remaining highs are only in `xlsx` (which user chose to keep).

- [ ] **Step 3: Push to develop branch**

```bash
git push origin develop
```

Then verify Vercel preview build passes before merging to main.
