# E2E Smoke Tests

## Overview

Three Playwright smoke tests run against the deployed frontend on every push.

| Spec | What it checks |
|------|----------------|
| `login.spec.ts` | Login form submits and redirects to dashboard; sidebar visible |
| `students.spec.ts` | Students page renders table or empty state (no Access Denied) |
| `health.spec.ts` | Backend `/api/health` returns 200 + `{ status: "ok" }` |

## Running locally

```bash
# Against the deployed preview URL (fast, no local build needed)
PLAYWRIGHT_SKIP_WEBSERVER=1 \
E2E_BASE_URL=https://front-end-beige-zeta.vercel.app \
npm run test:e2e

# With interactive UI runner
npm run test:e2e:ui
```

## Environment variables

| Variable | Default (local dev only) | Purpose |
|----------|--------------------------|---------|
| `E2E_BASE_URL` | `http://localhost:3000` | Frontend URL under test |
| `E2E_BACKEND_URL` | `https://back-end-theta-two.vercel.app` | Backend URL for health check |
| `E2E_PHONE` | `+996559147444` | Login phone (use GitHub secret in CI) |
| `E2E_PASSWORD` | `StrongPassword123` | Login password (use GitHub secret in CI) |

> **Security note:** never commit real credentials to env files.
> Set `E2E_PHONE` / `E2E_PASSWORD` as GitHub Actions secrets.
> The fallback values are intentionally documented here for local dev only.

## CI

The `e2e` job in `.github/workflows/ci.yml` runs on every push to `main`/`develop`
with `continue-on-error: true`. Failures are visible but non-blocking while the
test suite stabilises.
