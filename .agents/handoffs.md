# Handoff Prompts (Inter-Agent Transitions)

These are the **exact prompts** you copy-paste when moving work from one agent to the next. They preserve context, enforce input requirements, and prevent drift.

Always inject the current `shared-memory.md` content with each handoff.

---

## 0 → Product Agent (Kickoff)

```
You are now acting as the Product Agent.

# Shared Memory (current state)
<paste shared-memory.md>

# Your task
Produce a complete PRD per your output format (sections 1–11).

# Inputs
IDEA: <one sentence or paragraph>

BUSINESS GOAL: <why; who benefits>

CONSTRAINTS:
- Timeline: <weeks/months>
- Team: <people>
- Stack: React/Next.js + Node.js/Express + PostgreSQL
- Budget: <optional>

TARGET USERS: <optional>

NOTES: <research, competitors, prior versions>

# Before you finish
Run the Product Agent quality checklist (see checklists.md §Product).
If any input above is missing or ambiguous, ASK before producing the PRD.
```

---

## Product → Frontend

```
You are now acting as the Frontend Agent.

# Shared Memory (current state)
<paste shared-memory.md, which now includes the signed-off PRD>

# Your task
Using the PRD above, produce a frontend architecture per your output format
(sections 1–11). Pay special attention to §5 (Required API Contracts) —
this is the contract Backend will build against, so be exhaustive.

# Required deliverables
- Route map
- Component tree for every main screen
- State management plan (server / client / URL / form)
- API contracts with request, success, AND error shapes
- UI states (loading / empty / error / success / permission denied)
- Accessibility checklist
- Performance budget
- Phased implementation plan
- Open questions for backend (do not silently guess)

# Constraints
- Stack: Next.js 14+ App Router, TypeScript, Tailwind, shadcn/ui, TanStack Query, Zod
- Must respect PRD's non-functional requirements

# Before you finish
Run the Frontend Agent quality checklist (see checklists.md §Frontend).
```

---

## Frontend → Backend

```
You are now acting as the Backend Agent.

# Shared Memory (current state)
<paste shared-memory.md, which now includes PRD + Frontend output>

# Your task
Using the PRD and the Frontend's API contracts (§5 of frontend output),
produce a complete backend architecture per your output format (sections 1–13).

# Hard rules
- Every API contract from Frontend must be implemented EXACTLY OR
  raised in your §13 (Open Questions / Renegotiations). Do NOT silently change.
- Every table must have indexes for its actual query patterns.
- Every endpoint must have error responses documented.
- Auth model must be specific (not "the usual JWT").

# Stack
- Node.js + TypeScript + Express
- PostgreSQL 15+ via Prisma
- Redis (only if a queue or rate-limit need is established)

# Before you finish
Run the Backend Agent quality checklist (see checklists.md §Backend).
```

---

## Backend → DevOps

```
You are now acting as the DevOps Agent.

# Shared Memory (current state)
<paste shared-memory.md, which now includes PRD + Frontend + Backend output>

# Your task
Using the Backend's system architecture and the PRD's non-functional
requirements, produce a complete delivery plan per your output format
(sections 1–14).

# Hard rules
- Choose managed PaaS unless there's a documented reason for K8s.
- Backups + restore procedure are mandatory deliverables.
- Every alert needs a threshold and a runbook link.
- Cost estimate needs real numbers (MVP and 10x).
- CI must catch lint, types, tests, and security scan before any deploy.

# Inputs
- Expected MVP load: <e.g., 1k DAU, 5 req/s peak>
- Budget: <e.g., < $200/mo at MVP>
- Geography: <e.g., US + EU>
- Team ops capacity: <e.g., 1 engineer, no SRE>

# Before you finish
Run the DevOps Agent quality checklist (see checklists.md §DevOps).
```

---

## Rejection / loop-back template (Orchestrator → any agent)

Use this when an agent's output is incomplete:

```
Your previous output is rejected. Here are the specific gaps:

GAPS:
1. <specific section that's missing or wrong>
2. <specific section that's missing or wrong>
3. ...

Please regenerate ONLY the affected sections, addressing each gap
explicitly. Do not change sections that were accepted.

# Shared Memory (current state)
<paste current shared-memory.md>

# Your previous output (for reference)
<paste their previous output>
```

---

## Renegotiation prompt (when two agents conflict)

When Backend raises something in §13 that conflicts with Frontend, the Orchestrator runs this:

```
Frontend Agent — Backend has raised the following renegotiations against
your API contracts:

<paste Backend's §13>

For each item, respond with ONE of:
(A) Accept Backend's proposed change — update your §5 accordingly.
(B) Reject — provide concrete UI reason why your contract must stand.
(C) Counter-propose — offer a third option that satisfies both sides.

Do not produce any other output until each item has a decision.
```

After Frontend responds, the Orchestrator updates shared memory with the
final agreed contracts and resumes the pipeline.

---

## Final review prompt (Orchestrator → user)

After all four agents have signed off:

```
All agents have produced their deliverables. Here is the consolidated
project plan:

# Product
<PRD summary>

# Frontend
<UI architecture summary>

# Backend
<API + DB summary>

# DevOps
<Infra + CI/CD summary>

# Open questions
<anything left in shared-memory.md unresolved>

# Recommended next step
<e.g., kick off Phase 1 implementation, starting with auth>

Do you want to:
(A) Approve and proceed to implementation
(B) Revise — which section?
(C) Add a feature — which one?
```
