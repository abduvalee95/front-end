# Tests

Two layers, split by what they need to run.

## Unit — `tests/unit/`, vitest

Pure logic, no server, no browser. This is where the decisions that gate access
live, so they are tested where the loop is fast enough to actually run them.

```bash
npm run test:unit          # once
npm run test:unit:watch    # while editing
```

| Spec | What it pins |
|------|--------------|
| `rbac.test.ts` | route permissions; a null role denies everything |
| `verify-token.test.ts` | signature verification, edited payloads, `alg:none`, expired ≠ forged |
| `normalize-messages.test.ts` | a client cannot claim the `system` role |
| `ai-actions.test.ts` | the action allowlist and its payload schemas |
| `admin-secret.test.ts` | fail-closed when `ADMIN_SECRET` is unset |
| `rate-limit.test.ts` | window arithmetic, per-key and per-namespace isolation |
| `use-local-storage-state.test.tsx` | the store hook behind the schedule to-do list |

Node is the default environment; the one DOM spec opts in with a
`// @vitest-environment jsdom` docblock. jsdom's `TextEncoder` returns a
`Uint8Array` from another realm, which `jose` rejects — so token tests must not
run under it.

## E2E — `tests/e2e/`, Playwright

### `tests/e2e/local/` — blocking in CI

Runs against a locally built app with **no backend**. These are regression
tests for bugs that actually shipped, so they gate merges.

```bash
npm run build
JWT_ACCESS_SECRET=dev-secret ADMIN_SECRET=dev-admin npm run start &
PLAYWRIGHT_SKIP_WEBSERVER=1 E2E_BASE_URL=http://127.0.0.1:3000 \
JWT_ACCESS_SECRET=dev-secret npm run test:e2e:local
```

`JWT_ACCESS_SECRET` must match the value the server was started with. When it
is unset the signed-token cases **skip rather than fail**, so a green run with
skips means the secret did not line up.

| Spec | What it pins |
|------|--------------|
| `auth-route-protection.spec.ts` | the dotted-path auth bypass, both causes |
| `ai-actions.spec.ts` | only allowlisted actions execute |
| `ai-rate-limit.spec.ts` | auth and throttling on the paid AI routes |
| `admin-secret.spec.ts` | workflow endpoints, and that cron can still reach them |
| `design-tokens.spec.ts` | computed contrast in both themes |
| `server-env.spec.ts` | the backend URL resolves to a fetchable origin |

### `tests/e2e/smoke/` — non-blocking

Drives a real login against the deployed backend, so it fails for reasons that
have nothing to do with the commit under test.

```bash
PLAYWRIGHT_SKIP_WEBSERVER=1 \
E2E_BASE_URL=https://front-end-beige-zeta.vercel.app \
npm run test:e2e:smoke
```

| Variable | Default (local dev only) |
|----------|--------------------------|
| `E2E_BASE_URL` | `http://localhost:3000` |
| `E2E_PHONE` / `E2E_PASSWORD` | documented dev creds |

> Never commit real credentials. Set `E2E_PHONE` / `E2E_PASSWORD` as GitHub
> Actions secrets.

## CI

`.github/workflows/ci.yml`. The `verify` job is **blocking end to end** —
typecheck, lint, `design:audit`, unit tests, build, then `tests/e2e/local`.
Only the `smoke` job carries `continue-on-error`, and only because it depends
on a live backend.

Lint and the whole e2e job used to be non-blocking. A gate that reports and
shrugs trains everyone to ignore it, which is worse than not having one.

## Two habits

1. **Prove the test has teeth.** Revert the fix, watch it fail, put it back. A
   stale server on the port will happily report a pass for code that is no
   longer running.
2. **It has to pass on a re-run.** Rate-limit counters live in the server
   process, so specs generate a fresh `sub` each time. A fixed one passes once
   and fails on the second run.
