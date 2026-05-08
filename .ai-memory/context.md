---
# AI MEMORY — CRM+LMS SuperAdmin
updated: 2026-05-03
repo: front-end (local, no remote confirmed)

## STACK
- next: 16.2.4 [CONFIRMED package.json:30]
- react: 19.2.4 [CONFIRMED package.json:31]
- router: App Router [CONFIRMED — src/app/ directory]
- styling: tailwindcss ^4 (no tailwind.config file — uses @import "tailwindcss" + @theme in globals.css) [CONFIRMED]
- state: zustand ^5.0.12 [CONFIRMED package.json:37]
- data-fetching: @tanstack/react-query ^5.100.7 [CONFIRMED package.json:22]
- table: @tanstack/react-table ^8.21.3 [CONFIRMED]
- forms: react-hook-form ^7.75.0 [CONFIRMED]
- http-client: axios ^1.15.2 (instance at src/lib/api/client.ts) [CONFIRMED]
- toasts: sonner ^2.0.7 [CONFIRMED]
- icons: lucide-react ^1.14.0 [CONFIRMED]
- charts: recharts ^3.8.1 [CONFIRMED]
- radix-ui: dialog, dropdown-menu, select, tabs, tooltip, avatar, checkbox, label, scroll-area, slot [CONFIRMED]
- backend: nestjs + prisma (inferred from DTOs read in back-end/) [INFERRED]
- api: REST [CONFIRMED]
- node: UNKNOWN (no engines field)
- packageManager: npm (package-lock.json present) [INFERRED — no pnpm/yarn lockfile found]

## STRUCTURE
```
src/
  app/
    (auth)/login/page.tsx          [CONFIRMED]
    (dashboard)/layout.tsx         [CONFIRMED — client layout w/ SessionProvider]
    (dashboard)/dashboard/page.tsx [CONFIRMED — static placeholder stats]
    (dashboard)/analytics/page.tsx [CONFIRMED]
    admin/layout.tsx               [CONFIRMED — server, SUPER_ADMIN role guard]
    admin/dashboard/page.tsx       [CONFIRMED — static placeholders]
    admin/organizations/page.tsx   [CONFIRMED — client, list+modals]
    admin/organizations/[id]/page.tsx [CONFIRMED — detail view]
    admin/organizations/new/page.tsx  [CONFIRMED — redirects to /admin/organizations]
    api/auth/login/route.ts        [CONFIRMED]
    api/auth/logout/route.ts       [CONFIRMED]
    api/auth/me/route.ts           [CONFIRMED]
    api/auth/refresh/route.ts      [CONFIRMED]
    api/ai/insights/               [CONFIRMED — exists, not read]
  components/
    ui/button.tsx badge.tsx card.tsx input.tsx [CONFIRMED]
    admin/AdminSidebar.tsx AdminHeader.tsx AdminProviders.tsx [CONFIRMED]
    admin/organizations/
      OrganizationsTable.tsx       [CONFIRMED]
      CreateOrganizationModal.tsx  [CONFIRMED]
      EditOrganizationModal.tsx    [CONFIRMED]
      StatusConfirmDialog.tsx      [CONFIRMED]
      OrgStatsCards.tsx            [CONFIRMED]
      OrganizationStatusBadge.tsx  [CONFIRMED]
      OrganizationForm.tsx         [CONFIRMED — legacy, not used in new flow]
    auth/session-provider.tsx      [CONFIRMED]
  hooks/
    useAuth.ts useOrganizations.ts useProtectedRoute.ts [CONFIRMED]
  lib/
    api/client.ts      [CONFIRMED — axios, /api/ base, 401 refresh queue]
    auth/session.ts    [CONFIRMED — restoreSession, endSession, isSuperAdmin]
    auth/token-config.ts [CONFIRMED — TTLs, cookie options]
    auth/silent-refresh.ts [CONFIRMED — exists]
  services/
    platform.ts   [CONFIRMED — platformService, 4 methods]
    analytics.ts  [CONFIRMED — exists]
  store/
    auth.store.ts [CONFIRMED — zustand persist, key: 'auth-storage']
  types/
    auth.ts       [CONFIRMED — User, UserRole, TokenPayload]
    platform.ts   [CONFIRMED — PlatformOrganization, DTOs]
  proxy.ts        [CONFIRMED — middleware + proxy, exported as proxy()]
```

## ROUTES
| Path | File | Notes |
|------|------|-------|
| / | app/page.tsx | redirects → /dashboard [CONFIRMED] |
| /login | app/(auth)/login/page.tsx | [CONFIRMED] |
| /dashboard | app/(dashboard)/dashboard/page.tsx | [CONFIRMED] |
| /analytics | app/(dashboard)/analytics/page.tsx | [CONFIRMED] |
| /admin/dashboard | app/admin/dashboard/page.tsx | SUPER_ADMIN only [CONFIRMED] |
| /admin/organizations | app/admin/organizations/page.tsx | SUPER_ADMIN only [CONFIRMED] |
| /admin/organizations/[id] | app/admin/organizations/[id]/page.tsx | detail view [CONFIRMED] |
| /admin/organizations/new | app/admin/organizations/new/page.tsx | redirects → /admin/organizations [CONFIRMED] |
| /api/auth/login | app/api/auth/login/route.ts | POST, sets cookies [CONFIRMED] |
| /api/auth/logout | app/api/auth/logout/route.ts | POST, clears cookies [CONFIRMED] |
| /api/auth/me | app/api/auth/me/route.ts | GET, returns user [CONFIRMED] |
| /api/auth/refresh | app/api/auth/refresh/route.ts | POST, rotates tokens [CONFIRMED] |
| /api/ai/insights | app/api/ai/insights/ | UNKNOWN (not read) |
| /api/proxy/* | proxy.ts rewrite | forwards to NEXT_PUBLIC_API_URL [CONFIRMED] |

**Middleware:** `src/proxy.ts` exports `proxy()` function + `config.matcher` — this IS the Next.js middleware (no separate middleware.ts). [CONFIRMED proxy.ts:83-85]

## API CONTRACT (SuperAdmin / Platform)
All calls via axios base `/api/` → proxied at `/api/proxy/` → backend `NEXT_PUBLIC_API_URL`.
Frontend service file: `src/services/platform.ts` uses base `/proxy/platform`.

| Method | Backend Path | Frontend Call | Response Type | Status |
|--------|-------------|---------------|---------------|--------|
| POST | /platform/register | `/proxy/platform/register` | `RegisterOrganizationResponse` | [CONFIRMED] |
| GET | /platform/organizations | `/proxy/platform/organizations` | `PaginatedOrganizationsResponse` | [CONFIRMED] |
| PATCH | /platform/:id | `/proxy/platform/:id` | `PlatformOrganization` | [CONFIRMED] |
| PATCH | /platform/organizations/:id/status | `/proxy/platform/organizations/:id/status` | `PlatformOrganization` | [CONFIRMED] |
| GET | /platform/all | NOT IMPLEMENTED in frontend | returns `User[]` | [CONFIRMED backend only] |
| GET | /platform/users | NOT IMPLEMENTED in frontend | paginated users | [CONFIRMED backend only] |

**No DELETE endpoint exists on backend.** [CONFIRMED — removed from UI]

### Response Field Reference
`PlatformOrganization`: `id, name, email, phone, status, created_at, updated_at, usersCount` [CONFIRMED types/platform.ts]
`PaginatedOrganizationsResponse`: `{ items: PlatformOrganization[], meta: { total, page, limit, pages } }` [CONFIRMED]
`RegisterOrganizationResponse`: `organization_id, Org_name, Org_status, Org_email, id, adminEmail, adminName, phone, adminRole, created_at` [CONFIRMED]

### Create Org Payload (POST /platform/register)
`Org_name, Org_email, Org_status?, adminEmail, adminName, phone, password (min 6), adminRole` [CONFIRMED]

### Update Org Payload (PATCH /platform/:id)
`name?, email?, phone?, status?, telegram_chat_id?, whatsapp_target?` [CONFIRMED]

## AUTH FLOW
- mechanism: JWT (access + refresh tokens) [CONFIRMED]
- storage: HttpOnly cookies [CONFIRMED token-config.ts]
- access token cookie: `access_token` (15 min TTL) [CONFIRMED token-config.ts:11]
- refresh token cookie: `refresh_token` (7 day TTL) [CONFIRMED token-config.ts:17]
- JWT payload fields: `sub, email, role, organization_id, iat, exp` [CONFIRMED types/auth.ts:57-64]
- middleware file: `src/proxy.ts` (also handles /api/proxy/ rewrite) [CONFIRMED]
- protected routes (middleware): `/dashboard/*`, `/admin/*` [CONFIRMED proxy.ts:46]
- `/admin/*` role guard: role decoded from JWT, must be `SUPER_ADMIN` [CONFIRMED proxy.ts:66-73]
- admin layout guard: same check server-side via `Buffer.from(payload, 'base64')` [CONFIRMED layout.tsx:7-16]
- login endpoint (backend): `POST /user/login` (phone + password) [CONFIRMED login/route.ts:30]
- logout: `POST /api/auth/logout` → clears cookies, calls `POST /auth/logout` on backend [CONFIRMED]
- session restore: `restoreSession()` calls `GET /api/auth/me` → Zustand store [CONFIRMED]
- role redirect on login: `SUPER_ADMIN` → `/admin/dashboard`, others → `/dashboard` [CONFIRMED useAuth.ts:26-29]
- Zustand persist key: `auth-storage` [CONFIRMED auth.store.ts:39]

## DESIGN SYSTEM
- **Education Center Theme** (updated 2026-05-03):
  - Primary: HSL(238 66% 56%) - Education Indigo (#4338CA)
  - Secondary: HSL(240 50% 96%) - Soft lavender (#EEEDFA)
  - Accent: HSL(172 66% 95%) - Teal for LMS (#E6FAF8)
  - Background: HSL(210 33% 98%) - Soft blue-gray (#F7F9FC)
  - Foreground: HSL(224 71% 14%) - Deep navy (#0B1437)
  - Sidebar bg: HSL(228 66% 11%) - Deep navy (#0F1535)
  - Sidebar text: HSL(226 20% 63%) - Light gray-blue (#8E95B4)
  - Sidebar active: HSL(238 66% 62%) - Bright indigo (#5B50E6)
  - Education semantic colors: success (teal), warning (amber), info (blue)
  - Module accents: CRM (purple), LMS (teal)
  - Gradient classes: edu-gradient-primary, edu-gradient-warm, edu-gradient-header, edu-gradient-accent, edu-gradient-card-1/2/3/4, edu-gradient-logo, edu-gradient-btn, edu-gradient-badge-crm/lms, edu-gradient-avatar
  - Dark mode: Deep navy backgrounds (HSL(228 66% 6%)) with lighter text
- border radius: 0.625rem (10px) [CONFIRMED globals.css]
- font: Geist (loaded in root layout) [INFERRED]
- no tailwind.config.ts — config is inline via @theme in globals.css [CONFIRMED]

## ENV VARS
- `NEXT_PUBLIC_API_URL` — used in: all api/auth/*.ts route handlers + proxy.ts [CONFIRMED]
  - fallback: `http://localhost:5000` in auth routes, `http://localhost:3001` in proxy.ts [CONFIRMED]
- No .env.example or .env.local found (gitignored) [CONFIRMED — file search returned 0 results]

## COMPONENTS (real inventory)
**UI primitives** (`src/components/ui/`):
- `Button` — variants: default, destructive, outline, secondary, ghost, link [CONFIRMED]
- `Badge` — variants: default, secondary, destructive, outline, success, warning [CONFIRMED]
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` [CONFIRMED]
- `Input` [CONFIRMED]

**Admin org components** (all CONFIRMED):
- `OrganizationsTable` — uses `onCreateClick` + `onEditClick` props
- `CreateOrganizationModal` — Radix Dialog, react-hook-form
- `EditOrganizationModal` — Radix Dialog, react-hook-form, pre-fills from `PlatformOrganization`
- `StatusConfirmDialog` — Radix Dialog, confirm toggle
- `OrgStatsCards` — derives stats from list data (no dedicated stats endpoint)
- `OrganizationStatusBadge` — `ACTIVE` → success variant, `INACTIVE` → destructive
- `OrganizationForm` — legacy, not wired to new flow (still in filesystem)

## KNOWN ISSUES
- `OrganizationForm.tsx` is a legacy file still in components/admin/organizations/ — not used [CONFIRMED]
- Admin dashboard stats (`24`, `1,284`, `$12,450`) are hardcoded placeholders [CONFIRMED admin/dashboard/page.tsx:8-13]
- `GET /platform/all` and `GET /platform/users` backend endpoints exist but have no frontend implementation [CONFIRMED]
- `api/ai/insights` route exists but was not read — purpose UNKNOWN
- `src/proxy.ts:27` fallback URL is `localhost:3001` but auth routes use `localhost:5000` — inconsistency [CONFIRMED]
- `useAuth.ts:26` checks `role === 'admin'` (lowercase) in addition to `SUPER_ADMIN` — may be a stale condition [CONFIRMED useAuth.ts:26]

## NEXT TASKS
1. Real-time stats on admin dashboard (connect to `/platform/organizations` + `/platform/users`)
2. Platform users directory (wire up `GET /platform/users`)
3. Org detail page currently finds org by scanning full list (`limit:100`) — add dedicated `GET /platform/organizations/:id` to backend or cache
4. Fix fallback URL inconsistency (proxy.ts vs auth routes — `3001` vs `5000`)

## RECENT UPDATES
- **2026-05-03:** Applied Education Center theme to entire Super Admin platform:
  - Updated globals.css with HSL-based education color scheme (indigo, teal, soft backgrounds)
  - Added gradient utility classes for buttons, cards, badges, avatars, headers
  - Updated all sidebar components (DashboardSidebar, admin-sidebar) with education theme
  - Updated admin organizations page header with gradient background
  - Updated stat cards with gradient top accents and education colors
  - Updated status badges with teal (active) and amber (inactive) colors
  - Updated all primary buttons with edu-gradient-btn class
  - Updated dialogs with gradient accent bars
  - Updated table rows with indigo hover styling
  - Updated avatars with edu-gradient-avatar fallback
  - Updated empty states with gradient icon and education messaging
  - Updated skeleton loading with indigo theme colors
- **2026-05-03:** Added `.ai-memory/backend.md` mapping full backend routes, schemas, roles, and DTOs.
- **2026-05-03:** Created `/users` dashboard page + `InviteUserModal` + `useInviteUser` hook tied to real backend (`POST /proxy/organizations/users`). Required `password` per DTO, enforce `+996` phone format.

## TOKEN ECONOMY RULES
- always read this file first
- never re-scan full project unless asked
- if a component or endpoint is not listed here, check the file before assuming it exists
- prefer short answers referencing this file
- update this file when new files/endpoints are confirmed
---
