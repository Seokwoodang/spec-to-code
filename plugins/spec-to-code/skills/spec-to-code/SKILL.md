---
name: spec-to-code
description: This skill should be used when the user wants to turn an incomplete or ambiguous spec/PRD into complete, verified, production code — triggers include "/spec-to-code", "implement this spec", "build from this spec", "기획서로 개발", "불완전한 기획서", "spec to code", "turn this spec into code", or when handed a feature spec (in any format — md, HTML, PDF, image, Figma, docx, URL, pasted text) and asked to code it properly with tests, review, and docs. Runs a gated TDD flow that resolves spec gaps with the user before any code is written.
version: 0.9.0
---

# Spec-to-Code

Turn an **incomplete spec** into **complete, verified code** through a gated, test-driven flow. The whole value of this skill is the work *between* spec and code: finding what the spec leaves unsaid, resolving it with the user, and proving the result.

## Core principle

```
any-format spec → [normalize] → [find gaps] → [resolve w/ user] → resolved spec → TDD code → review loop → proof docs
```

**Never write feature code from an unresolved spec.** An incomplete spec produces incomplete code by construction. The resolved spec — every case, edge, and error decided — is the real input to coding. Two hard rules:

1. **Gaps are resolved by the user, not by Claude.** When the spec is silent or ambiguous, ask. Do not invent behavior and proceed. (Trivial, reversible, clearly-conventional defaults may be assumed *and reported* — but anything that changes observable behavior is a question.)
2. **If a requirement cannot be written as a test, it is still a gap.** Untestable = underspecified. Send it back to the user before coding.

## Flow at a glance

| # | Phase | Output | Stop? |
|---|-------|--------|-------|
| 1 | Ingest & probe | normalized working spec + env facts (runner, UI?, Playwright?) | — |
| 2 | Gap analysis | gap list (exhaustive) | — |
| 3 | Gap resolution | **A. Resolved Spec** + **D. Test Plan** | — |
| 4 | **🚪 Gate 1** | user approves A + D | **HARD STOP** |
| 5 | Design | layer split (logic / UI) + **B. Traceability Matrix** (draft) | — |
| 6 | Tests first | logic unit tests + UI behavior tests — **RED** | — |
| 7 | Implement logic | logic tests **GREEN** | — |
| 8 | Implement UI | UI behavior tests **GREEN** | — |
| 9 | Visual verify | Playwright screenshots → baseline candidates | — |
| 10 | **🔁 Review loop** | **E. Review Doc**; review → user → fix → re-review until pass | **GATE (iterative)** |
| 11 | Comprehensive verify | fill **B**; spec-conformance + full suite + separation audit | — |
| 12 | **🚪 Gate 2** | report **C** + **D**(report) + **B** + **E** + **F** + screenshots; user approves | **HARD STOP** |

Three human checkpoints: Gate 1 (*pre-code* — "building the right thing?"), the Review loop (*iterative* — quality/bugs cleaned with the user), Gate 2 (*post-code* — "built it right?"). Everything else flows.

## Phase detail

### 1 — Ingest & probe
**Ingest:** specs arrive in any format — markdown, HTML/mockup, PDF, image/Figma export, `.docx`, URL, or pasted text. Detect the format and normalize it into one analyzable **working spec**, preserving a pointer to each source. For visual sources (HTML/image/Figma), also capture a **visual notes** block (layout, component hierarchy, states) for the UI layer. Lossy formats (a screenshot, a happy-path mockup) omit behavior — those omissions are gaps, fed straight to Phase 2. See `references/spec-ingestion.md`.

**Feature identity & snapshot:** establish a stable **`<slug>`** for the feature — lowercase kebab-case from its name (e.g. `cart-bulk-delete`); confirm with the user. The slug names the doc home `docs/spec-to-code/<slug>/` (or nest under the repo's own docs convention; decide once). Persist three things: **archive the user's original spec verbatim** into `source/<date>-original.<ext>` (a *copy* — the original stays put; a paste is saved as `.md`, a URL as its fetched snapshot); **save the normalized `working-spec.md`** (header points to the archived original); create **`index.md`** (manifest) and open a **`CHANGELOG.md`** entry for this run (fresh seeds "initial build"; update records the diff + task checklist — see Modes). The diff baseline for updates is `working-spec.md` (normalized, always comparable); the archived originals exist for fidelity-checks and re-normalization. This snapshot — not the user's original file, which stays wherever they keep it — is what a later update diffs against. Never move or edit the user's original spec; only reference it. All artifacts are Markdown in the doc home; code/tests stay in the project's conventional locations. See `references/documents.md` for the authoritative storage/naming/format rules and templates.

**Probe** (project-agnostic — detect, do not assume): test runner (`vitest`/`jest`/`pytest`/`go test`…); whether a renderable UI exists or it's CLI/library (decides if UI layers apply); Playwright presence (if a UI exists but it's absent, *offer* to add it — never install silently); doc home location (default `docs/spec-to-code/<slug>/`, else match the repo convention). **Read the repo's `CLAUDE.md` and obey it** — especially "never commit without explicit instruction" and "don't touch spec files."

**Mode:** list existing slugs under `docs/spec-to-code/`. If one holds prior artifacts (`working-spec.md` + ≥ `A-resolved-spec.md`) for **this** feature, it is an **UPDATE** — diff the new working spec against the saved `working-spec.md` and follow `references/spec-update.md` (impact-analyze via Matrix B, resolve delta gaps, delta TDD, **regression**), then overwrite the snapshot. Otherwise it is **FRESH** — continue below. If it's ambiguous which slug a revision targets (e.g. the new spec file is named differently), **ask the user** rather than guess; a wrong match corrupts the diff.

**Deferred check (proactive, on every resume):** whenever a run targets a feature whose `F-deferred.md` has open items, **surface them up front and ask the user which to take on now** — before proceeding. Do not leave a "not now" silently parked across sessions. This fires on *any* resumption — an update run, or simply returning to the feature with no spec change — so every deferral is actively revisited with the user, never forgotten. Flag items whose revisit trigger has plausibly fired (e.g. the blocking backend endpoint now exists). Items the user again defers stay in F with their triggers; items picked up join this run's scope.

### 2 — Gap analysis
Enumerate everything needed for *complete* code that the working spec does not pin down. Be exhaustive, not polite. See `references/gap-analysis.md` for the taxonomy (states, transitions, edge values, error/failure modes, empty/loading/boundary, concurrency, permissions, i18n, a11y, non-functional). For a large/multi-section spec, fan out the *reading* with the bundled **`gap-hunter`** agent (`subagent_type: 'gap-hunter'`) — one per section, distinct lenses — else `Explore`/inline. Resolution stays interactive.

### 3 — Gap resolution
Group gaps into a few decision questions and put them to the user (`AskUserQuestion` for crisp choices; prose for open ones). Batch — never drip one at a time. As answers land, write **Artifact A (Resolved Spec)** and derive **Artifact D (Test Plan)**. Loop until zero open gaps and every requirement maps to a planned test. Templates: `references/documents.md`.

### 4 — 🚪 Gate 1 (hard stop)
Present A + D; get explicit approval before any code. If a decision changes, update A + D and re-present.

### 5 — Design
Design the **logic/UI split** (a stated goal): pure logic isolated from rendering so logic is unit-testable and UI is thin. Draft **Artifact B (Traceability Matrix)**: one row per spec case → planned test(s) → target code unit → status (`TODO`).

### 6 — Tests first (RED)
Write planned tests before implementation: logic unit tests + UI-behavior tests (state→view, interactions, error display). They must fail for the right reason. Writing them is the final gap detector — a test that can't be written concretely → back to Phase 3.

### 7–8 — Implement to GREEN
Logic until logic tests pass; then thin UI over the tested logic until UI-behavior tests pass. Keep the split intact.

### 9 — Visual verify
For UIs, run the app and capture Playwright screenshots per state — *baseline candidates* the user blesses at Gate 2, then guarded by `toHaveScreenshot()`. Baselines live where Playwright stores them (its `*-snapshots/` dirs beside the e2e tests) and are committed; C links to them. See `references/verification.md`.

### 10 — 🔁 Review loop (iterative gate)
Run an AI code review over the diff with the bundled **`code-reviewer`** agent (`subagent_type: 'code-reviewer'`): spec-faithfulness (vs Artifact A) + correctness/bugs, edge cases, security, simplification/reuse, convention adherence, logic/UI separation. Write findings to **Artifact E (Review Doc)**. Then loop **with the user**:
1. Present E. The user discusses each finding — accept / reject (with reason) / defer.
2. Apply accepted fixes.
3. Re-review the updated diff → new round in E (reuse ids; mark resolved).
4. Repeat until no open `blocker`/`major` findings **and** the user signs off.

Do not proceed to Phase 11 until the loop passes. This is the user's "review → comment → re-review → pass → next" checkpoint.

### 11 — Comprehensive verify
Run the full suite, then audit: conformance (every Artifact-A case demonstrably covered), traceability fully filled (no `TODO` rows — empty cells = unfinished work, say so), logic/UI separation. Good Workflow fan-out (conformance/coverage/separation as parallel dimensions, each adversarially checked by the **`spec-verifier`** agent) — see `scripts/verify-workflow.js`. Only call Workflow if multi-agent orchestration is opted into; else audit inline.

### 12 — 🚪 Gate 2 (hard stop)
Compile **C (Completion Doc)** + **D (Test Report)** + filled **B** + **E (Review Doc)** + **F (Deferred & Blocked)** + screenshots, and report. The user reviews docs, not raw code. Surface the open F items (what's parked + revisit triggers) and any residual assumptions explicitly. Wait for approval. Never commit unless explicitly told.

## The six artifacts

| | Doc | Purpose | Written |
|--|-----|---------|---------|
| A | Resolved Spec | every decision/case/edge/error pinned down | P3 |
| D | Test Doc | Plan (case list) → Report (results, coverage) | Plan P3 · Report P11 |
| B | Traceability Matrix | spec ↔ test ↔ code ↔ pass — coverage proof | P5 draft → P11 fill |
| E | Review Doc | code-review findings, per round, with dispositions | P10 |
| F | Deferred & Blocked | parking lot — blocked/deferred/out-of-scope, with revisit triggers | any phase (living) |
| C | Completion Doc | summary, decisions, how-to-run/verify, screenshots, residual gaps | P11–12 |

Full templates: `references/documents.md`. Write artifacts in the user's working language. Matrix B is the spine of "did you do it right" — an empty cell is an admission, never hide one.

**No silent drop:** anything that cannot be done now or is postponed goes to **Artifact F** the moment it arises (a deferred gap, a `defer`-dispositioned review finding, work blocked on a backend/external dependency, an out-of-scope discovery). Each F entry carries a concrete revisit trigger. If a parked item maps to an A-case, its test is marked skipped/pending with a reason pointing to the F id and its B-row is marked `deferred` — never quietly passed or blank.

## Guardrails
- Three human checkpoints (Gate 1, Review loop, Gate 2) are mandatory; never skip them to "save time."
- Never commit or push unless the user explicitly instructs it. Obey the repo's `CLAUDE.md`.
- Never edit user-managed spec files to match the code; record deviations where the repo expects them and ask.
- Scale rigor to scope: a one-function spec is lighter than a multi-screen feature — but the resolved-spec rule and the checkpoints always hold.

## Modes: fresh vs update
This flow runs greenfield **and** for later spec revisions. Phase 1 detects which: prior artifacts in the doc home → **update**; none → **fresh**. The update path (`references/spec-update.md`) diffs old vs new spec, reverse-looks-up Matrix B to find the impacted cases/tests/code, and records the work as a **`CHANGELOG.md` entry whose Tasks checklist is the user-facing "what this update will do"** — presented at the delta Gate 1 for approval. It then resolves only the delta's gaps, does delta TDD, and — critically — runs the **full prior suite as a regression guard** so a revision never silently breaks an existing case. Artifacts A/B/D/F are updated with history kept, and the CHANGELOG tasks are ticked off to completion. The checkpoint discipline and the resolved-spec rule are identical; only the scope narrows to the delta + regression.

## Resources
- `references/spec-ingestion.md` — normalizing any input format (md/HTML/PDF/image/Figma/docx/URL)
- `references/spec-update.md` — update mode: applying a spec revision to existing code (delta + regression)
- `references/gap-analysis.md` — exhaustive gap taxonomy + questioning patterns
- `references/verification.md` — the 3-layer test stack (logic TDD · Playwright E2E · screenshot baseline)
- `references/documents.md` — templates for artifacts A/B/C/D/E/F
- `scripts/verify-workflow.js` — Workflow harness for the Phase-11 comprehensive verification fan-out
- Bundled agents (when installed via the plugin): **`gap-hunter`** (P2 gap reading), **`code-reviewer`** (P10 review loop), **`spec-verifier`** (P11 adversarial verify). The skill degrades gracefully to `Explore`/inline if absent.
