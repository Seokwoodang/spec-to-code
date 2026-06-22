---
name: spec-to-code-backend
description: This skill should be used to build a **backend / API / server / database** feature from an incomplete or ambiguous spec — triggers include "/spec-to-code-backend", "implement this API/endpoint", "build this service", "백엔드 기획서로 개발", "서버/API 구현", or when handed a backend spec to code with tests, review, and docs. Runs a gated TDD flow (logic unit tests · integration/API-contract tests · DB/migration checks) that resolves spec gaps with the user before any code is written. For UI work use spec-to-code-frontend; for features spanning both use spec-to-code-fullstack.
version: 1.0.0
---

# Spec-to-Code · Backend

Turn an **incomplete backend spec** into **complete, verified server code** through a gated, test-driven flow. The value is the work *between* spec and code: pinning down the contract, auth, data, and failure behavior the spec leaves unsaid — then proving it.

```
any-format spec → [normalize] → [find gaps] → [resolve w/ user] → resolved spec → TDD code → review loop → proof docs
```

## Two hard rules
1. **Gaps are resolved by the user, not invented by Claude.** Spec silent/ambiguous → ask. Trivial reversible defaults may be assumed *and reported*; anything that changes contract/behavior/data is a question.
2. **If a requirement can't be written as a test, it's still a gap.** Untestable = underspecified → back to the user before coding.

**Never write server code from an unresolved spec** — the gate guard (below) structurally enforces it.

## Flow at a glance
Stop: 🔴 = hard stop (both modes) · 🟠/🟡 = stop only in step-through · — = never.

| # | Phase | Output | Stop |
|---|-------|--------|------|
| 1 | Ingest & probe | working spec + env facts (runner, DB?, framework) + mode/tier | — |
| 2 | Gap analysis | exhaustive gap list (incl. auth/idempotency/tx/limits) | — |
| 3 | Gap resolution | `02-resolved-spec.md` | →4 |
| 4 | **🚪 Gate 1** | user approves resolved-spec | 🔴 |
| 5 | Design | `03-design.md` (endpoints · schemas · DB · errors) + `05-traceability.md` | 🟠 |
| 6 | **🚪 Tests first (RED)** | `04-test-doc.md` + failing unit/integration/contract tests | 🔴 |
| 7–8 | Implement → GREEN | domain logic → API handlers + persistence | 🟡 |
| 9 | Integration verify | run suite against a **test DB / stubs**; contract conformance | 🟠 |
| 10 | **🔁 Review loop** | `06-review/r<k>.md` (independent) until pass | 🔴 |
| 11 | Comprehensive verify | fill traceability + `07-verify.md` | — |
| 12 | **🚪 Gate 2** | `08-completion.md` + package; final approval | 🔴 |

## How the flow stops
- **Checkpoint mode (default)** — stops only at the 4 🔴 (Gate 1 · Tests gate · Review loop · Gate 2). **Step-through** ("꼼꼼히/단계별로") also stops at 5,7,8,9. Both skip 1/2/11 and run the review loop **with the user**. Too many hard stops breed rubber-stamping — stop only where the user's judgment changes the outcome.
- **Gates are document-driven, not chat.** At each 🔴: produce/update that gate's Markdown → **tell the user the exact path** → they read & approve, or edit the file (their edits ARE approval) → proceed only then. `AskUserQuestion`/chat is for **gap resolution only** (Phase 3). All versions/rounds kept.

## Phases

**1 · Ingest & probe** — normalize the spec (any format) into `01-working-spec.md`. Pick a kebab-case `<slug>`; doc home `docs/spec-to-code/<slug>/`; fresh→`v1/`, update→next `v(N+1)/`; archive original to `source/`; create `index.md` + `CHANGELOG.md` (common). Write `.spec-to-code-state.json` (`{"active":true,"slug","tier","mode":"checkpoint","scope":"build","specApproved":false,"designApproved":false,"testsApproved":false,"reviewApproved":false,"gate2Approved":false,"docHome"}`). **Probe:** test runner; **DB / ORM / migration tool**; web framework; existing API conventions. Read & obey the repo's `CLAUDE.md`. Detect mode (fresh/update), tier (full/lite), and **scope** (build / docs-only). Surface open `deferred.md` items. See `references/spec-ingestion.md`, `references/documents.md`.

**2 · Gap analysis** — exhaustive. Beyond the general taxonomy (`references/gap-analysis.md`), backend-specific categories are **mandatory to walk**: authn/authz (who can call this, scopes), input validation & sanitization, **idempotency** (retries/dupes), **transactions & consistency**, **concurrency/locking** (races, lost updates), **rate limits/quotas**, pagination/filtering/sorting contracts, **error model** (status codes + machine codes), data lifecycle (soft delete, retention), audit/logging, external-call failure (timeout/retry/circuit). Fan out with `gap-hunter` for large specs. Apply **branch completeness**: for every condition the spec states (when X → A), resolve its complement (not-X → ?) — the most-missed gap.

**3 · Gap resolution** — batch into decision questions; write `02-resolved-spec.md` as answers land. Loop until zero open gaps and every requirement is test-shaped.

**4 · 🚪 Gate 1** — hand over `02-resolved-spec.md`; on approval set `specApproved:true`.

**5 · Design** 🟠 — write `03-design.md`, the complete dev doc: **every endpoint** (method, path, auth, params), **request/response schemas + status & error codes**, **DB schema + migrations**, service/repository layering, transaction boundaries, external integrations, and where each resolved case is enforced. Draft `05-traceability.md`. Hand over → on approval `designApproved:true`. Mandatory & hook-enforced.

**6 · 🚪 Tests first (RED)** — write **unit (pure logic) + integration (against a test DB) + API-contract (request→status/shape/error-code)** tests before impl; they must fail for the right reason. Record in `04-test-doc.md`. Hand over design+tests → on approval `testsApproved:true`.

**Scope — `docs` (no implementation):** if the user asked to stop at the docs (e.g. "문서까지만", "구현 하지마", "설계+테스트만", "docs only", "RED까지"), the run **ends here, after the Tests gate**. Deliverable: `02-resolved-spec.md` + `03-design.md` + `04-test-doc.md` + `05-traceability.md`(draft) + the **RED test files** (failing, ready for the next dev to make GREEN). Do **NOT** set `testsApproved` → implementation stays hook-blocked. Record a handoff in `index.md`/`CHANGELOG.md` ("docs complete — implement by making the RED tests pass"), set `active:false`, and stop. The default `build` scope continues below.

**7–8 · Implement → GREEN** — domain logic until unit tests pass; then API handlers + persistence until integration/contract tests pass. Keep logic separable from framework/IO.

**9 · Integration verify** 🟠 — run the suite against a **real test DB / external stubs** (migrations applied), confirm contract conformance (status codes, error model, pagination). For a pure library, this folds into the unit suite. See `references/verification.md`.

**10 · 🔁 Review loop** — spawn an **independent reviewer** (`code-reviewer` agent; else fresh subagent): fresh context, sees only the diff + resolved spec, **never the author**. Backend lenses emphasized: auth holes, injection, missing tx, idempotency, N+1/perf, error-leak. PR-grade findings (severity · file:line · snippet · why · fix) → new `06-review/r<k>.md` → user dispositions → fix → **re-run reviewer on updated code as `r<k+1>.md`**. Repeat until no open blocker/major **and** the user approves the latest round; **only then set `reviewApproved:true`**. A "fix all" / disposition is **NOT** round approval — the user must explicitly OK the re-reviewed round first. The hook blocks `07-verify.md`/`08-completion.md` until this flag is set, so this 🔴 can't be skipped silently. Never self-reviewed/self-dispositioned.

**11 · Comprehensive verify** — full suite + audit (conformance, traceability filled, logic/IO separation); `spec-verifier` / `scripts/verify-workflow.js` for fan-out. Write `07-verify.md`.

**12 · 🚪 Gate 2** — compile `08-completion.md` + verify + traceability + reviews + `deferred.md`; report; surface open deferred items. On approval set `gate2Approved:true` then `active:false`. Never commit unless told.

## Artifacts
Per-version files in `v<N>/`; common at slug root. Templates + storage: `references/documents.md`.

| File | Purpose |
|------|---------|
| `01-working-spec.md` | normalized snapshot (diff baseline) |
| `02-resolved-spec.md` | decisions/cases/edges/errors pinned down |
| `03-design.md` | endpoints · schemas · DB · error codes · layering |
| `04-test-doc.md` | unit/integration/contract plan → report |
| `05-traceability.md` | spec ↔ test ↔ code ↔ pass |
| `06-review/r<k>.md` | independent review, all rounds kept |
| `07-verify.md` | comprehensive verification |
| `08-completion.md` | summary, how-to-run/migrate, residual |
| `deferred.md` · `index.md` · `CHANGELOG.md` · `source/` *(common)* | TODO parking lot · manifest · run log · originals |

**No silent drop:** anything blocked/deferred/out-of-scope → `deferred.md` with a revisit trigger the moment it arises; mapped cases get a skipped/pending test + `deferred` traceability row.

## Enforcement (gate guard)
Bundled PreToolUse hook (`hooks/gate-guard.mjs`), staged: `designApproved:false` → all code & test edits blocked (only doc home + state file writable); `designApproved:true, testsApproved:false` → tests allowed, **impl blocked**; `testsApproved:true` → code/tests allowed; `reviewApproved:false` → **`07-verify.md`/`08-completion.md` writes blocked** (can't pass the Review-loop 🔴 into comprehensive-verify/Gate 2 until the latest round is user-approved). Scoped & fail-open: no active state file → complete no-op; any error allows the edit. Makes "no server code without an approved design" — and "no verify/completion before an approved review round" — impossible to skip silently.

## Guardrails
- The 🔴 checkpoints are mandatory (hook-enforced); never skip.
- Never commit/push unless explicitly told. Obey the repo's `CLAUDE.md`.
- **Migrations**: never auto-run destructive migrations; design them reviewable (additive, reversible) and let the user apply.
- **fresh vs update** (by prior artifacts) and **full vs lite** (by scope) are orthogonal; update always runs the prior suite as a regression guard.

## Resources
- `references/documents.md` — artifact templates + storage
- `references/spec-ingestion.md` — normalizing any input format
- `references/gap-analysis.md` — gap taxonomy (+ backend categories)
- `references/verification.md` — backend test stack (unit · integration · contract · migration)
- `references/spec-update.md` — update mode (delta + regression)
- `references/lite-mode.md` — lite tier (small changes)
- `scripts/verify-workflow.js` — Phase-11 fan-out harness
- Bundled agents: `gap-hunter`, `code-reviewer`, `spec-verifier` (degrade to `Explore`/inline if absent).
