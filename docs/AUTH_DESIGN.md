# Authentication design — phase 1

Approved direction: navy editorial panel, teal actions, white forms, Inter and existing semantic design tokens. Responsive layouts and Uzbek, Russian, English and Kyrgyz copy.

## Delivered

- `/login`: new design with the existing phone/password backend contract, keyboard-accessible password visibility, inline errors, real loading state and account-help disclosure.
- Invalid login credentials no longer run through the shared Axios refresh interceptor. They stay on the form instead of triggering refresh/logout navigation.
- `/auth-preview`: explicitly labelled interactive design sandbox for email/phone login, Google, signup, email verification, center creation, invitations and password recovery. No network calls, persistence, session creation or real Google redirects.
- Preview is 404 by default. Enable `AUTH_DESIGN_PREVIEW=true` only in a local or review environment, then visit `/auth-preview`. Do not enter real credentials. The flag is not an authentication or access-control mechanism.

## Local review

```sh
npm ci
AUTH_DESIGN_PREVIEW=true npm run dev
```

Visit `/login` and `/auth-preview`. Change language using the header. Test widths 390 and 1440, light and dark themes.

## Backend integration next

Do not connect preview state transitions to production. Replace them with server-validated auth flows:

1. Add Account and AuthIdentity alongside existing tenant User records, preserving existing foreign keys. Review duplicate emails before linking accounts.
2. Add per-device Session, single-use email verification/password-reset tokens, and invitation records. Keep existing phone login during migration.
3. Implement email signup/verification, login and reset with enumeration-resistant responses, expiry, rate limits, atomic token consumption and session revocation.
4. Implement Google authorization-code flow: server-side transaction, state/nonce, PKCE, verified issuer/audience/signature/expiry and unique provider subject. Require proof before linking an existing account. Provision OAuth credentials via server environment only.
5. Add onboarding endpoints that validate invitation email, expiry and membership. A creator becomes ADMIN only in the organization created in the same transaction; public registration must never assign SUPER_ADMIN.
6. Next.js owns same-origin HttpOnly cookies. No application tokens in URLs, browser storage or client responses. Authenticate and authorize every tenant request server-side. Add CSRF protections to cookie-backed writes.
7. Once server flows pass integration tests, introduce real `/register`, `/verify-email`, `/forgot-password`, `/reset-password` and protected `/onboarding` routes. Do not publish working-looking buttons until their endpoints are ready.

Acceptance gates: existing login works; new email signup and verified Google identity converge safely; duplicate identities cannot take over an account; inactive organizations are denied; foreign-organization invitations cannot escalate privileges; simultaneous refresh/reset/invite consumption is safe; OAuth cancel/expired state is recoverable; mobile/keyboard and all four locales remain usable.

## Verification notes

- 125 unit tests passed; TypeScript, ESLint and design-token audit passed.
- Production compilation passed with the Sentry build wrapper temporarily omitted locally and Sentry DSN/token unset. Automatic approval review rejected an outbound Sentry ingest request; no Sentry configuration change is included in this PR.
- Browser checks use a locally installed Chromium binary because the standard Playwright CDN download returned a broken archive in this environment.
- Phone-login request and 401 handling are tested with a mocked auth response; no live backend credentials or production accounts were used.
- Screenshots in `docs/auth-design/` show actual rendered Next.js pages, not generated mockups.
- Final local E2E suite: 45 passed, 1 preview-only test skipped with preview disabled. That preview-only test passed separately with `AUTH_DESIGN_PREVIEW=true`. No browser page errors in the captured walkthrough.
- The contrast test caught the original teal button at 4.26:1; darkening the scoped action token made the final light/dark contrast checks pass.
