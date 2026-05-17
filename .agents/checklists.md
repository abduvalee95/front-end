# Quality Checklists

Every agent runs its checklist BEFORE returning output. The Orchestrator runs the same checklist when reviewing. If any box can't be checked, the work is incomplete.

---

## §Product Agent Checklist

**PRD content**
- [ ] Product brief is 2–4 sentences, no marketing fluff
- [ ] At least 2 personas with goals AND pains
- [ ] At least 8 user stories in "As a __, I want __, so that __" form
- [ ] Each story has a priority (P0 / P1 / P2)
- [ ] Functional requirements are numbered, testable, and grouped by feature
- [ ] No implementation details ("use Redis", "build with React") — those belong to FE/BE

**Non-functional**
- [ ] Performance target has numbers (e.g., p95 < 200ms)
- [ ] Security requirements specify auth method and data sensitivity
- [ ] Accessibility level stated (e.g., WCAG 2.1 AA)
- [ ] Availability target stated (e.g., 99.5%)

**Edge cases**
- [ ] Offline behavior addressed
- [ ] Malformed input addressed
- [ ] Third-party failure addressed
- [ ] Rate-limit behavior addressed
- [ ] Concurrent edits addressed (if relevant)

**Success & scope**
- [ ] At least 3 success metrics with numeric targets and dates
- [ ] At least 3 risks with severity + mitigation
- [ ] Explicit "Out of Scope" list

---

## §Frontend Agent Checklist

**Architecture**
- [ ] App Router vs Pages Router chosen + justified
- [ ] Rendering strategy chosen per route (SSR / SSG / ISR / CSR)
- [ ] Route map table is complete

**Components & state**
- [ ] Every main screen has a component tree
- [ ] Server / Client components are clearly marked
- [ ] Server state location: TanStack Query
- [ ] Client state stores listed (Zustand or context) with ownership
- [ ] URL state listed (filters, pagination)
- [ ] Forms have Zod schemas

**API contracts (the hard part)**
- [ ] Every PRD user story maps to at least one screen + one API call
- [ ] Every endpoint has request shape
- [ ] Every endpoint has success response shape
- [ ] Every endpoint has error responses (400 / 401 / 403 / 404 / 422 / 500 minimum)
- [ ] Pagination strategy specified where lists exist
- [ ] No "TBD" in any contract — unknowns go to §11 Open Questions

**UX states**
- [ ] Loading / empty / error / success / permission-denied defined per data screen

**A11y & performance**
- [ ] Accessibility checklist is concrete (color contrast, keyboard, ARIA, focus)
- [ ] Performance budget has numbers (LCP, INP, bundle size)

**Plan**
- [ ] Implementation plan in 3–5 phases ordered by user value

---

## §Backend Agent Checklist

**Architecture**
- [ ] Process model documented (single server / workers / cron)
- [ ] External dependencies listed (Postgres, Redis, email, …)

**Database**
- [ ] Every table has SQL `CREATE TABLE` provided
- [ ] Primary keys use UUID v7 (or justified alternative)
- [ ] Foreign keys have explicit ON DELETE behavior
- [ ] NOT NULL constraints on required columns
- [ ] CHECK constraints on enums and ranges
- [ ] Unique constraints where business rules require uniqueness
- [ ] Indexes for actual query patterns (not just PK + FK)
- [ ] `created_at` / `updated_at` on every mutable table
- [ ] Soft delete column where retention is required

**API**
- [ ] Every Frontend API contract is implemented exactly OR raised in §13
- [ ] OpenAPI 3.1 spec provided (or full structured table)
- [ ] Every endpoint has documented error responses
- [ ] Standard error envelope is defined
- [ ] Rate limit category per endpoint

**Auth & security**
- [ ] Auth method chosen + justified
- [ ] Password hashing: Argon2id or bcrypt cost ≥ 12
- [ ] Token lifetimes specified
- [ ] Refresh token rotation strategy
- [ ] Authorization model explicit (row-level / RBAC / ABAC)

**Operations**
- [ ] Background jobs have retry policies + max duration
- [ ] Caching strategy specified (or "none needed at MVP" with reason)
- [ ] Pagination uses cursor (or justified offset)
- [ ] N+1 prevention strategy documented
- [ ] Health endpoints `/health/live` and `/health/ready` defined

**Tests**
- [ ] Unit tests planned
- [ ] Integration tests planned (HTTP + DB)
- [ ] Contract tests planned (every OpenAPI endpoint)

---

## §DevOps Agent Checklist

**Environments**
- [ ] Local, staging, production defined
- [ ] Deploy triggers documented per env

**Infra**
- [ ] Provider chosen per layer (FE, BE, DB, object storage, email)
- [ ] Managed PaaS preferred; K8s only if justified
- [ ] Region(s) chosen based on geography

**Docker**
- [ ] Multi-stage Dockerfile, runs as non-root
- [ ] `docker-compose.yml` covers app + Postgres + Redis (if used)
- [ ] Health checks present
- [ ] `.dockerignore` present

**CI/CD**
- [ ] PR pipeline: install → lint → typecheck → tests → build → security scan → preview deploy
- [ ] Main pipeline: same + migrations + staging deploy + smoke tests + manual approval → prod
- [ ] Rollback path documented

**Data**
- [ ] Backups configured: frequency, retention, PITR window
- [ ] Restore procedure documented and drilled cadence set
- [ ] Connection pooling configured

**Secrets**
- [ ] Secret manager chosen
- [ ] `.env.example` lists every required key (no values)
- [ ] Rotation policy stated
- [ ] Pre-commit secret scanning

**Observability**
- [ ] Structured logs shipped to a destination
- [ ] Metrics: RED + USE dashboards listed
- [ ] Error tracking: Sentry on FE + BE
- [ ] Uptime probes on `/health/live` and a core flow
- [ ] Alerts have thresholds AND runbook links

**Reliability & DR**
- [ ] Autoscaling triggers defined
- [ ] Graceful shutdown handled
- [ ] RPO + RTO numbers stated
- [ ] Restore runbook step-by-step

**Cost & runbooks**
- [ ] Cost table for MVP and 10x
- [ ] Runbooks for: DB saturation, 5xx spike, failed deploy, stolen secret, restore

---

## §Cross-Agent Consistency (Orchestrator runs this last)

- [ ] Every user story in PRD has a corresponding UI screen
- [ ] Every UI screen has its API calls in Frontend §5
- [ ] Every API contract in Frontend §5 exists in Backend OpenAPI
- [ ] Every Backend endpoint has an env-var entry in DevOps §7 (if it needs one)
- [ ] Every Backend external dep (Postgres, Redis, email) is in DevOps §3
- [ ] PRD non-functional perf target is achievable given Backend §9 and DevOps §3
- [ ] No agent silently overrode another agent's signed-off output
