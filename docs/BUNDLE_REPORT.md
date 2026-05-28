# Bundle Analysis Report

**Date:** 2026-05-28
**Next.js:** 16.2.x (Turbopack build)
**Analysis method:** `next experimental-analyze` + direct chunk inspection (`.next/static/chunks/`)

> Note: `@next/bundle-analyzer` requires Webpack; Turbopack builds must use
> `next experimental-analyze` or direct chunk sizing. Reports here are derived
> from Turbopack chunk sizes (pre-gzip).

---

## Total client bundle size

| Metric | Size |
|--------|------|
| Total JS (all chunks, pre-gzip) | ~7.2 MB |
| Estimated gzipped delivery | ~2.0–2.3 MB |

---

## Top 5 heaviest offenders

| Rank | Library / Module | Chunk size (pre-gzip) | Notes |
|------|------------------|-----------------------|-------|
| 1 | **recharts** | ~2.3 MB across 7+ chunks | Appears in every route that has a chart; `attendance` + `reports` import recharts directly (not lazy) |
| 2 | **@ai-sdk / ai** | ~451 KB | Loaded via `AICopilotLazy` (`next/dynamic`) — already deferred, but still large |
| 3 | **jspdf + html2canvas-pro** | ~630 KB combined | Already dynamically imported via `src/lib/receipt/pdf.ts`; triggered only on print |
| 4 | **xlsx (SheetJS)** | ~402 KB | Already dynamically imported via `src/lib/excel.ts`; triggered only on export |
| 5 | **Framework / app code** | ~532 KB (largest single chunk) | Shared vendor chunk; hard to trim without route-splitting |

---

## Top 3 reduction recommendations

### 1. Lazy-load recharts on `attendance` and `reports` pages

`attendance/page.tsx` and `reports/page.tsx` do static top-level imports from `recharts`.
Unlike the dashboard (which wraps each chart component in `next/dynamic`), these routes
eagerly pull the full recharts bundle on page load.

```ts
// Before (in attendance/page.tsx and reports/page.tsx)
import { BarChart, Bar, ... } from 'recharts';

// After — extract chart JSX into a component and wrap with next/dynamic
const AttendanceChart = dynamic(
  () => import('@/components/charts/AttendanceChart'),
  { ssr: false, loading: () => <Skeleton className="h-[280px] rounded-2xl" /> },
);
```

Expected saving: removes recharts (~315 KB) from the initial load of these two routes.

### 2. Replace `xlsx` (SheetJS) with a lighter export utility

SheetJS community edition is ~402 KB pre-gzip. For the project's use case (JSON → XLSX
export + simple parse), [`exceljs`](https://github.com/exceljs/exceljs) offers a
tree-shakeable ESM build (~120 KB), or a custom CSV fallback can drop the dependency
entirely. Since xlsx is already dynamically imported, this is a pure swap with no
architectural change needed.

Expected saving: ~260–280 KB on dynamic chunk load.

### 3. Code-split the DashboardHeader modal imports

`src/components/layout/DashboardHeader.tsx` eagerly imports 5 large modal components
(`CreateStudentModal`, `CreateLeadModal`, `CreateTeacherModal`, `CreateCourseModal`,
`CreateGroupModal`). These are only rendered when the user clicks the "+" button.

```ts
// Replace static imports with next/dynamic
const CreateStudentModal = dynamic(() =>
  import('@/components/students/CreateStudentModal').then(m => m.CreateStudentModal),
  { ssr: false }
);
// ...same for the other 4 modals
```

Since `DashboardHeader` is in the shared layout, these modals inflate the bundle on
**every** dashboard route. Deferring them will reduce the shared chunk by an estimated
80–120 KB (combined modal trees).

---

## Existing `next/dynamic` candidates (already deferred — for reference)

The following are already correctly lazy-loaded; no action needed:

| Component | File |
|-----------|------|
| `RevenueChart`, `LeadsByStatusChart`, `PaymentMethodsChart` | `dashboard/page.tsx` |
| `AICopilot` | `components/ai/AICopilotLazy.tsx` |
| `jsPDF` + `html2canvas-pro` | `lib/receipt/pdf.ts` (async import on demand) |
| `xlsx` | `lib/excel.ts` (async import on demand) |

---

*Implementations for the above recommendations should land in a separate PR.*
