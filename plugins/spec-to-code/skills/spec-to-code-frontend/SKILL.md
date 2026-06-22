---
name: spec-to-code-frontend
description: This skill should be used to build a **frontend / UI** feature from an incomplete or ambiguous spec — triggers include "/spec-to-code-frontend", "/spec-to-code", "implement this UI spec", "build this screen/component", "기획서로 프론트 개발", "불완전한 기획서", or when handed a UI spec in any format (md, HTML, PDF, image, Figma, docx, URL, pasted text) to code with tests, review, and docs. Runs a gated TDD flow (logic unit tests · Playwright UI-behavior/screenshot verification) that resolves spec gaps with the user before any code is written. For server/API/DB work use spec-to-code-backend; for features spanning both use spec-to-code-fullstack.
version: 1.0.0
---

# Spec-to-Code · Frontend

Turn an **incomplete spec** into **complete, verified code** through a gated, test-driven flow. The value is the work *between* spec and code: finding what the spec leaves unsaid, resolving it with the user, and proving the result.

```
any-format spec → [normalize] → [find gaps] → [resolve w/ user] → resolved spec → TDD code → review loop → proof docs
```

## Two hard rules
1. **Gaps are resolved by the user, not invented by Claude.** When the spec is silent/ambiguous, ask. Trivial, reversible, conventional defaults may be assumed *and reported*; anything that changes observable behavior is a question.
2. **If a requirement can't be written as a test, it's still a gap.** Untestable = underspecified → back to the user before coding.

**Never write feature code from an unresolved spec** — and the gate guard (below) structurally enforces it.

## Flow at a glance
Stop: 🔴 = hard stop (both modes) · 🟠/🟡 = stop only in step-through · — = never (show & continue).

| # | Phase | Output | Stop |
|---|-------|--------|------|
| 1 | Ingest & probe | working spec + env facts + mode/tier | — |
| 2 | Gap analysis | exhaustive gap list | — |
| 3 | Gap resolution | `02-resolved-spec.md` | →4 |
| 4 | **🚪 Gate 1** | user approves resolved-spec | 🔴 |
| 5 | Design | `03-design.md` + `05-traceability.md`(draft) | 🟠 |
| 6 | **🚪 Tests first (RED)** | `04-test-doc.md` + failing tests, approved pre-impl | 🔴 |
| 7–8 | Implement → GREEN | logic then thin UI | 🟡 |
| 9 | Visual verify | Playwright screenshots → baseline | 🟠 |
| 10 | **🔁 Review loop** | `06-review/r<k>.md` (independent) until pass | 🔴 |
| 11 | Comprehensive verify | fill traceability + `07-verify.md` | — |
| 12 | **🚪 Gate 2** | `08-completion.md` + package; final approval | 🔴 |

## How the flow stops
- **Checkpoint mode (default)** — stops only at the 4 🔴 (Gate 1 · Tests gate · Review loop · Gate 2); the preceding 🟠/🟡 work is folded into the next stop. **Step-through** (user says "꼼꼼히/단계별로") additionally stops at 5,7,8,9. Both skip 1/2/11 and both run the review loop **with the user**. Too many hard stops breed rubber-stamping — stop only where the user's judgment changes the outcome.
- **Gates are document-driven, not chat.** At each 🔴: produce/update that gate's Markdown in the doc home → **tell the user the exact path** → they read & approve, or edit the file (their edits ARE the approval) → proceed only then. `AskUserQuestion`/chat is for **gap resolution only** (Phase 3). All versions/rounds are kept, never overwritten. Surfacing decisions as chat tables instead of approvable files defeats the flow.

## Phases

**1 · Ingest & probe**
- **Normalize** the spec (any format) into one `01-working-spec.md`; capture *visual notes* for UI sources. A completed/static HTML is both visual spec and reusable markup. See `references/spec-ingestion.md`.
- **Identity & layout:** pick a stable kebab-case `<slug>` (confirm). Doc home = `docs/spec-to-code/<slug>/` (or match repo convention). Fresh → `v1/`; update → next `v(N+1)/`. Archive the original verbatim to `source/`; save `01-working-spec.md` in `v<N>/`; create/update `index.md` + a `CHANGELOG.md` entry (COMMON, at slug root). Storage rules: `references/documents.md`.
- **Gate-guard state:** write `.spec-to-code-state.json` at project root: `{"active":true,"slug":"<slug>","tier":"full|lite","mode":"checkpoint","scope":"build","specApproved":false,"designApproved":false,"testsApproved":false,"reviewApproved":false,"gate2Approved":false,"docHome":"docs/spec-to-code/<slug>"}`.
- **Probe** (detect, don't assume): test runner; UI vs CLI/library (decides UI layers); Playwright (offer to add if UI present & absent — never install silently). **Read & obey the repo's `CLAUDE.md`** (esp. no-commit-without-instruction).
- **Mode:** a matching `v*/01-working-spec.md` + `v*/02-resolved-spec.md` exists → **UPDATE** (`references/spec-update.md`: diff vs latest `vN`, impact-analyze, delta TDD, **regression**). Else **FRESH**. Ambiguous slug → ask, don't guess.
- **Deferred check:** if `deferred.md` has open items, **surface them and ask which to take on now** before proceeding (every resume, any mode).
- **Tier:** quick gap scan → **lite** for small low-risk changes, else **full** (`references/lite-mode.md`). Lite collapses to 4 steps / 1 gate / one CHANGELOG entry but keeps the safety core; escalates to full on any blocker. The rest of this doc is **full** build scope; if the user wants docs only (no implementation), see the `docs` scope note before Phase 7.

**2 · Gap analysis** — enumerate everything needed for *complete* code the spec doesn't pin down; be exhaustive. Taxonomy + questioning: `references/gap-analysis.md`. Large spec → fan out reading with the `gap-hunter` agent (else `Explore`/inline). Apply **branch completeness**: for every condition the spec states (when X → A), resolve its complement (not-X → ?) — the most-missed gap.

**3 · Gap resolution** — batch gaps into a few decision questions (`AskUserQuestion` for crisp choices). Write `02-resolved-spec.md` as answers land. Loop until zero open gaps and every requirement is test-shaped.

**4 · 🚪 Gate 1** — hand over `02-resolved-spec.md`; on approval set `specApproved:true` (code/tests still blocked).

**5 · Design** 🟠 — write `03-design.md`, **the complete dev doc**: approach, logic/UI split, **every file+path**, types, **full function list w/ signatures**, an **exhaustive behavior spec** (every interaction branch, state, transition, edge, error), integration points; if HTML was input, how it decomposes into components. Draft `05-traceability.md` (`TODO` rows). Hand over → on approval set `designApproved:true` (unblocks tests). Mandatory & hook-enforced.

**6 · 🚪 Tests first (RED)** — write logic + UI-behavior tests before impl; they must fail for the right reason (a test that can't be written → back to Phase 3). Record in `04-test-doc.md`. Hand over design+tests → on approval set `testsApproved:true` (unblocks impl).

**Scope — `docs` (no implementation):** if the user asked to stop at the docs (e.g. "문서까지만", "구현 하지마", "설계+테스트만", "docs only", "RED까지"), the run **ends here, after the Tests gate**. Deliverable: `02-resolved-spec.md` + `03-design.md` + `04-test-doc.md` + `05-traceability.md`(draft) + the **RED test files** (failing, ready for the next dev to make GREEN). Do **NOT** set `testsApproved` → implementation stays hook-blocked. Record a handoff in `index.md`/`CHANGELOG.md` ("docs complete — implement by making the RED tests pass"), set `active:false`, and stop. The default `build` scope continues below.

**7–8 · Implement → GREEN** — logic until logic tests pass; then thin UI over tested logic. Keep the split.

**9 · Visual verify** 🟠 — for UIs, capture Playwright screenshots per state (baseline candidates, blessed at Gate 2). `references/verification.md`.

**10 · 🔁 Review loop** — spawn an **independent reviewer** (`code-reviewer` agent; else fresh `general-purpose`/`claude`): fresh context, sees only current diff + resolved spec, **never the author**. PR-grade findings (severity · file:line · snippet · why · fix-as-code) → write to a **new** `06-review/r<k>.md` → hand over → user dispositions each (fix/defer/reject) → apply fixes → **re-run on updated code as `r<k+1>.md`**. Repeat until no open blocker/major **and** the user approves the latest round; **only then set `reviewApproved:true`**. A "fix all" / per-finding disposition is **NOT** round approval — fixing and re-reviewing still requires the user's explicit OK on the resulting round before advancing. The hook blocks `07-verify.md`/`08-completion.md` until this flag is set, so you cannot silently skip this 🔴. Never self-reviewed, never self-dispositioned.

**11 · Comprehensive verify** — full suite + audit (conformance, traceability filled, logic/UI separation); the `spec-verifier` agent / `scripts/verify-workflow.js` for fan-out. Write `07-verify.md`.

**12 · 🚪 Gate 2** — compile `08-completion.md` + verify + filled traceability + reviews + `deferred.md` + screenshots; report; surface open deferred items. On approval set `gate2Approved:true` then `active:false`. Never commit unless told.

## Artifacts
Per-version files in `v<N>/`; common files at slug root. Each gate hands one over. Templates + storage rules: `references/documents.md`.

| File | Purpose | Gate |
|------|---------|------|
| `01-working-spec.md` | normalized snapshot (diff baseline) | — |
| `02-resolved-spec.md` | decisions/cases/edges/errors pinned down | Gate 1 |
| `03-design.md` | complete dev doc — files, functions, behavior | Tests gate |
| `04-test-doc.md` | test plan → report | Tests gate |
| `05-traceability.md` | spec ↔ test ↔ code ↔ pass (empty cell = unfinished) | — |
| `06-review/r<k>.md` | independent review, all rounds kept | Review loop |
| `07-verify.md` | comprehensive verification | (pre Gate 2) |
| `08-completion.md` | summary, how-to-run, residual | Gate 2 |
| `deferred.md` *(common)* | parking lot / TODO + revisit triggers | — |
| `index.md` · `CHANGELOG.md` · `source/` *(common)* | manifest · run log · original archive | — |

**No silent drop:** anything that can't be done now (deferred gap, `defer`-dispositioned finding, backend-blocked work, out-of-scope) goes to `deferred.md` with a concrete revisit trigger the moment it arises. If it maps to a spec-case, its test is skipped/pending (reason → deferred id) and its traceability row marked `deferred` — never quietly passed or blank.

## Enforcement (gate guard)
A bundled PreToolUse hook (`hooks/gate-guard.mjs`) makes the gates structural, in stages: `designApproved:false` → **all code & test edits blocked** (only doc home + state file writable); `designApproved:true, testsApproved:false` → tests allowed, **impl blocked**; `testsApproved:true` → code/tests allowed; `reviewApproved:false` → **`07-verify.md`/`08-completion.md` writes blocked** (can't advance past the Review-loop 🔴 into comprehensive-verify/Gate 2 until the latest review round is user-approved). **Scoped & fail-open**: with no active state file it's a complete no-op (never touches ordinary work elsewhere); any error allows the edit. This makes "no code without an approved design" — and "no verify/completion before an approved review round" — impossible to skip silently.

## Guardrails
- The 🔴 checkpoints are mandatory (and hook-enforced); never skip to "save time."
- Never commit/push unless explicitly told. Obey the repo's `CLAUDE.md`.
- Never edit user-managed spec files to match code; record deviations and ask.
- **fresh vs update** and **full vs lite** are orthogonal — fresh/update by prior artifacts, full/lite by scope. Update always runs the prior suite as a regression guard.

## Resources
- `references/documents.md` — artifact templates + authoritative storage/naming
- `references/spec-ingestion.md` — normalizing any input format (incl. completed HTML)
- `references/gap-analysis.md` — gap taxonomy + questioning
- `references/verification.md` — 3-layer test stack (logic TDD · Playwright E2E · screenshot)
- `references/spec-update.md` — update mode (delta + regression)
- `references/lite-mode.md` — lite tier (small changes)
- `scripts/verify-workflow.js` — Phase-11 fan-out harness
- Bundled agents (when installed): `gap-hunter` (P2), `code-reviewer` (P10), `spec-verifier` (P11); degrade to `Explore`/inline if absent.
- Worked example: `../../examples/example-run-product-search.md`.
