---
name: spec-to-code-fullstack
description: This skill should be used for a feature that spans **both UI and server** (frontend + backend) — triggers include "/spec-to-code-fullstack", "fullstack feature", "풀스택", "프론트랑 백엔드 같이", or a spec that clearly needs both a screen and an API/DB. It is a **thin orchestrator**, NOT a merged flow: it resolves the shared API contract with the user, then runs spec-to-code-backend and spec-to-code-frontend as separate specialized flows against that contract. Use spec-to-code-frontend or spec-to-code-backend directly for single-side work.
version: 1.0.0
---

# Spec-to-Code · Fullstack (orchestrator)

A fullstack feature is **not** built by one merged flow — that produces mediocre verification on both sides. Instead this skill **coordinates the two specialists** around the one thing they truly share: the **API contract**. Each half stays fully specialized (backend: integration/contract/DB tests; frontend: Playwright/screenshots).

```
spec (UI + server) → ① agree API contract → ② backend specialist → ③ frontend specialist
                          (shared seam)        (builds to contract)   (consumes contract)
```

## The orchestration

**0 · Ingest & scope.** Normalize the spec (any format incl. completed HTML). Pick a `<slug>`. Confirm it genuinely spans both sides — if it's UI-only or server-only, **stop and redirect** to `spec-to-code-frontend` / `spec-to-code-backend`.

**1 · 🚪 Resolve the API contract (shared seam).** Before either side builds, resolve the contract *with the user* and write it to **`docs/spec-to-code/<slug>/api-contract.md`** (see template below): each endpoint (method, path, auth), request/response schema, status + error codes, pagination. This is the single source of truth both sides bind to. Hand over the file; gate on approval. Resolving it once here prevents the two sides from inventing two incompatible shapes.

**2 · Backend first.** Run **`spec-to-code-backend`** for the server side, **with `api-contract.md` as a fixed input** (its resolved-spec must conform to the contract; contract tests assert it). Backend runs its full gated flow (Gate 1 → design → tests → review → Gate 2) end-to-end. Why first: the contract becomes *real and tested* before the UI depends on it; if implementation forces a contract change, update `api-contract.md` and note it for the frontend.

**3 · Frontend next.** Run **`spec-to-code-frontend`** for the UI, **consuming `api-contract.md`** (stub the API at that contract in UI-behavior tests; the contract defines the fetch shapes). Frontend runs its own full gated flow.

**4 · Integration seam (optional).** If an end-to-end path matters, add a thin e2e that exercises UI → real backend against a test DB; otherwise the contract tests (backend) + stubbed UI tests (frontend) already pin both sides to the same contract.

## Rules
- **Thin by design** — this skill has *no verification of its own*. All testing/review/docs happen inside the two specialist runs. Its only owned artifact is `api-contract.md`. (Each specialist run enforces its own mandatory Phase-2 `00-behavior-grid.md` grid + completeness critic, so the fullstack flow inherits exhaustive gap analysis on both sides — no extra step here.)
- **Contract drift** — if either side must change the contract, change `api-contract.md` (it's versioned with the run) and re-surface it to the other side; never let the two diverge silently.
- **Each side is a full run** — its own gates, hook enforcement, version folder, deferred list. Don't short-circuit them.
- Slugs: keep them findable — e.g. backend run under `<slug>` server scope, frontend under the UI scope; both link `api-contract.md`. (Or run as `<slug>-backend` / `<slug>-frontend` if cleaner.)

## `api-contract.md` template
```markdown
# API Contract — <feature>   status: draft | approved <date>

## Endpoints
### POST /api/<resource>
- auth: <required scope/role | public>
- request: `{ field: type, ... }`  (validation: ...)
- response 200: `{ ... }`
- errors: 400 `INVALID_<X>` · 401 unauth · 403 forbidden · 409 `CONFLICT_<Y>` · 429 rate-limit
### GET /api/<resource>?page=&limit=
- response: `{ items: [...], total, page }`  (default order: ...)

## Shared types
`type X = { ... }`

## Notes
- pagination / idempotency / error-model conventions shared by both sides.
```

## Resources
- delegates to **`spec-to-code-backend`** and **`spec-to-code-frontend`** (their SKILL.md are authoritative for each side).
