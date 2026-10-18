# Account authentication integration

Frontend branch: `codex/account-auth-bff-pr2`. Backend contract: `NWV-LMS/back-end` PR #2, reviewed at `b553503aae1b339f838fa566ae6c5a696b5fa068`. UI starts from approved frontend design PR #3. The backend PR is draft; this frontend change does not merge or enable it in production.

## Configuration

Set these **server environment variables** on the Next deployment and restart it:

| Variable | Value |
| --- | --- |
| `API_URL` | Origin of the deployment running backend PR #2, without `/api` |
| `AUTH_APP_URL` | Exact public Next app origin, HTTPS outside loopback development |
| `AUTH_BFF_SECRET` | Same random secret of at least 32 characters as the backend; direct server environment binding |
| `JWT_ACCESS_SECRET` | Backend's matching HS256 verification key; existing phone flow also needs it |

None of these secrets belongs in a `NEXT_PUBLIC_*` variable. `AUTH_BFF_SECRET` is also used locally to authenticate account-expiry metadata; a network-proxy placeholder cannot replace the actual value in the Next process. Do not commit environment files or paste secrets in chat.

Backend setup, additive migrations, `ACCOUNT_AUTH_ENABLED`, SMTP, Google credentials, provider URLs, and shared edge rate limiting remain governed by `docs/auth/backend-integration.md` in PR #2. Backend `postinstall` seeds a database: use `npm ci --ignore-scripts`, then explicitly generate Prisma and migrate only the intended isolated/staging database. Do not migrate the existing production backend as part of frontend setup.

Google `GOOGLE_REDIRECT_URI` must be `${AUTH_APP_URL}/api/auth/google/callback`. Backend email links target the same app's `/verify-email`, `/reset-password`, and `/accept-invitation`, with `#token=...` fragments. Use the registration browser for verification. Configure reverse-proxy/access-log redaction for the Google callback query; Next suppresses its own callback request logs and auth telemetry is filtered separately.

## Routes and sessions

Browser requests stay same-origin. `/api/auth/accounts/[...path]` exposes an explicit method/path/DTO allowlist and sends `X-Auth-BFF-Secret` only from the server. Backend errors are reduced to safe status/code pairs. Responses and fetches use `no-store`, bounded timeouts, and no upstream redirects.

1. `/register` creates a browser binding; `/verify-email` confirms the link only on a button click. Verification does not log the user in.
2. `/login` defaults to email. Google starts with a server-generated binding and returns through the server callback. Either produces **only** an opaque `account_session` cookie and opens `/onboarding`.
3. `/onboarding` resolves live account memberships. Users can create a center, link an existing phone/password membership, or accept an email invitation, then explicitly select a center.
4. Selection returns only the user profile to JavaScript. `access_token` and `refresh_token` cookies authorize the dashboard. Backend membership, tenant-session and parent-session checks remain authoritative.
5. `/invitations` is ADMIN-only, sends email invitations for TEACHER/MANAGER/STUDENT, and never returns a bearer invitation link.
6. `/forgot-password` and `/reset-password` implement recovery. Successful reset clears browser credentials; backend reset revokes all associated account/tenant sessions.

All credential cookies are HttpOnly, Secure in production, SameSite=Lax, path `/`, with bounded lifetimes. Signed HttpOnly `account_session_expires` metadata bounds tenant cookies to the account session; invalid/missing metadata cannot extend it. `/api/auth/refresh` rotates existing tenant credentials and preserves them on transient upstream failure. Browser refresh callers share one in-flight rotation. Account/center changes pause new rotations and drain old responses before writing credentials; aborted profile restoration cannot reinstall a previous tenant. When only a tenant session expires, the parent account remains available for center selection. Combined logout revokes account and tenant sessions best-effort and always clears the browser credentials.

Every browser mutation, including legacy phone login/refresh/logout, needs an exact trusted `Origin` plus `X-CSRF-Token` obtained from `/api/auth/csrf`; the double-submit cookie is HttpOnly. Server-owned browser bindings cannot be supplied in client JSON. Generic `/api/proxy/auth/*`, including encoded aliases, is blocked so it cannot expose raw backend tokens. Side-effect Route Handlers revalidate account-backed tenant sessions against the backend before authorizing actions.

Email bearer fragments are removed from browser history immediately and retained only in component memory. Verification/reset/invitation acceptance never executes on GET or mount. For an invitation before sign-in, an explicit Continue action moves the token to an HttpOnly pending cookie; email/Google sign-in resumes acceptance. No credential tokens are placed in localStorage, Zustand, redirects or JSON responses. The existing store persists only a display profile and is revalidated before protected content renders.

Legacy phone login remains available in the Phone tab and `/login#phone`, without requiring account-auth feature enablement. The gated `/auth-preview` remains a network-free design sandbox.

## Validation and rollout

Required frontend checks: `npx tsc --noEmit`, `npm run lint`, `npm run design:audit`, `npm run test:unit`, `npm run build`, and `npm run test:e2e:local`. Local browser tests mock application APIs where indicated; real BFF boundary tests exercise CSRF, cookie flags, callback failure and account/tenant isolation.

Integration validation additionally used the **actual PR #2 Nest controllers, DTO validation, guards and services**, Prisma, and disposable PostgreSQL 16 with all 28 checked-in SQL migrations. Email delivery and Google code/ticket transport were local fixtures. The real Google service still performed state, browser-binding, PKCE/nonce, replay, collision and explicit-link checks. This does not establish real SMTP delivery or Google's live token verification.

The supplied preview backend host is `back-fjra10vux-abduvalee95s-projects.vercel.app`. Cloud egress initially rejected its CONNECT request with HTTP 403. Its hostname and `binaries.prisma.sh` were added to the saved environment configuration draft, preserving existing domains. A later retry reached the preview: both `/api/health` and `/api/auth/accounts/me` returned HTTP 302 to `https://vercel.com/sso-api`. Vercel Deployment Protection currently blocks server API validation. Use an approved API-accessible test deployment or configure authorized server access to that protected preview; do not treat the SSO response as an auth API result. Applying/publishing environment settings is separate from saving the draft. Native Prisma downloads were unavailable in the running environment, so isolated validation used Prisma's bundled WASM engine with the official test-only PostgreSQL adapter; no backend application dependencies or tracked files were changed.

Before rollout, apply the backend PR to a test deployment, configure matching server secrets and the exact app origin, verify real verification/reset/invitation emails and Google callback, then repeat tenant switching, expiry/revocation and phone regression against that deployment. Keep account auth disabled on production until those provider and infrastructure checks pass. This frontend branch can be reviewed without merging either draft into master.

Recorded checks on 2026-10-18: frontend 281 unit tests passed; backend 31 unit and 20 HTTP integration tests passed; 65 direct Nest/PostgreSQL assertions and 41 frontend BFF/Chromium assertions passed with local provider transports. Production build (including TypeScript), lint and design audit passed. Final local browser regression: 75 passed, 1 expected skip because the design sandbox is disabled. The signed-token cases ran with the same fixture JWT secret as the server. Real SMTP and live Google verification are not claimed.
