---
name: spec-to-code
description: This skill should be used when the user wants to turn an incomplete or ambiguous spec/PRD into complete, verified, production code — triggers include "/spec-to-code", "implement this spec", "build from this spec", "기획서로 개발", "불완전한 기획서", "spec to code", "turn this spec into code", or when handed a feature spec and asked to code it properly with tests and docs. Runs a gated TDD flow that resolves spec gaps with the user before any code is written.
version: 0.1.0
---

# Spec-to-Code

Turn an **incomplete spec** into **complete, verified code** through a gated, test-driven flow. The whole value of this skill is the work *between* spec and code: finding what the spec leaves unsaid, resolving it with the user, and proving the result.

## Core principle

```
incomplete spec  →  [find gaps]  →  [resolve with user]  →  resolved spec  →  TDD code  →  proof docs
```

**Never write feature code from an unresolved spec.** An incomplete spec produces incomplete code by construction. The resolved spec — every case, edge, and error decided — is the real input to coding. Two hard rules:

1. **Gaps are resolved by the user, not by Claude.** When the spec is silent or ambiguous, ask. Do not invent behavior and proceed. (Trivial, reversible, clearly-conventional defaults may be assumed *and reported* — but anything that changes observable behavior is a question.)
2. **If a requirement cannot be written as a test, it is still a gap.** Untestable = underspecified. Send it back to the user before coding.

## Flow at a glance

| # | Phase | Output | Stop? |
|---|-------|--------|-------|
| 1 | Probe project | env facts (test runner, UI?, Playwright?) | — |
| 2 | Gap analysis | gap list (exhaustive) | — |
| 3 | Gap resolution | **A. Resolved Spec** + **D. Test Plan** | — |
| 4 | **🚪 Gate 1** | user approves A + D | **HARD STOP** |
| 5 | Design | layer split (logic / UI) + **B. Traceability Matrix** (draft) | — |
| 6 | Write tests first | logic unit tests + UI behavior tests — **RED** | — |
| 7 | Implement logic | logic tests **GREEN** | — |
| 8 | Implement UI | UI behavior tests **GREEN** | — |
| 9 | Visual verify | Playwright screenshots → baseline candidates | — |
| 10 | Comprehensive verify | fill **B**; spec-conformance + full suite + separation audit | — |
| 11 | **🚪 Gate 2** | report **C** + **D**(report) + **B** + screenshots; user approves | **HARD STOP** |

Gate 1 = the user's *pre-code* check ("am I building the right thing?"). Gate 2 = the *post-code* check ("did I build it right?"). These are the only two mandatory human stops; everything else flows.

## Phase detail

### 1 — Probe the project (generic)
This skill is project-agnostic, so first learn the environment. Detect, do not assume:
- Test runner: look for `vitest`/`jest`/`mocha`/`pytest`/`go test` etc. in `package.json`/config/lockfile.
- UI layer: is there a renderable UI (React/Vue/Svelte/etc.) or is this a CLI/library? This decides whether the UI-behavior and visual layers apply.
- Playwright: present in deps or `playwright.config.*`? If a UI exists but Playwright is absent, *offer* to add it — never install silently.
- Doc home: default artifacts to `docs/spec-to-code/<feature-slug>/`. If the repo has its own doc convention (e.g. a `doc/` tree), match it. Confirm the location once.
- **Read the repo's `CLAUDE.md`/contributing rules and obey them** — especially "do not commit without explicit instruction" and any "do not touch spec files" rules. This skill never commits on its own.

### 2 — Gap analysis
Read the spec and enumerate everything needed for *complete* code that the spec does not pin down. Be exhaustive, not polite. See `references/gap-analysis.md` for the full taxonomy (states, transitions, edge values, error/failure modes, empty/loading/boundary, concurrency, permissions, i18n, a11y, non-functional limits). For a large or multi-screen spec, fan this out with the Workflow tool (one reader per section) — but only the *reading*; resolution stays interactive.

### 3 — Gap resolution
Group gaps into a small number of decision questions and put them to the user (use `AskUserQuestion` for crisp choices; prose for open ones). Batch — do not drip one question at a time. As answers land, write them into **Artifact A (Resolved Spec)** and derive **Artifact D (Test Plan)** — the case list each test will cover. Templates: `references/documents.md`. Loop until zero open gaps and every requirement maps to at least one planned test.

### 4 — 🚪 Gate 1 (hard stop)
Present A + D and ask for explicit approval to proceed to code. Do not start Phase 5 until the user approves. If the user changes a decision, update A + D and re-present.

### 5 — Design
From the resolved spec, design the **logic/UI split** (this is a stated goal, not optional): pure logic isolated from rendering so logic is unit-testable and UI is thin. Draft **Artifact B (Traceability Matrix)**: one row per spec case → planned test(s) → target code unit → status (starts `TODO`).

### 6 — Tests first (RED)
Write the planned tests before implementation: logic unit tests + UI-behavior tests (state→view, interactions, error display). They must fail for the right reason (not-implemented), confirming RED. Writing them is the final gap detector — if a test can't be written concretely, return to Phase 3 with that gap.

### 7–8 — Implement to GREEN
Implement logic until logic tests pass; then build the UI layer on the tested logic until UI-behavior tests pass. Keep the layer split intact.

### 9 — Visual verify
For UIs, run the app and capture Playwright screenshots of each relevant state. These are *baseline candidates* — the user blesses them at Gate 2; once blessed, `toHaveScreenshot()` guards them. See `references/verification.md`.

### 10 — Comprehensive verify
Run the full suite, then audit: spec-conformance (every Artifact-A case demonstrably covered), traceability matrix fully filled (no `TODO` rows — empty cells = unfinished work, say so), and logic/UI separation respected. This audit is a good Workflow fan-out (conformance / coverage / separation as parallel dimensions, each adversarially verified). See `scripts/verify-workflow.js` for a ready harness — adapt it to the detected test commands. Only call Workflow if the user has opted into multi-agent orchestration; otherwise run the audit inline.

### 11 — 🚪 Gate 2 (hard stop)
Compile **Artifact C (Completion Doc)** + **D (Test Report)** + filled **B** + screenshots, and report. The user reviews docs, not raw code. Surface any residual gaps or assumptions explicitly. Wait for approval. Do not commit unless the user explicitly says to.

## The four artifacts

| | Doc | Purpose | Written |
|--|-----|---------|---------|
| A | Resolved Spec | every decision/case/edge/error pinned down | Phase 3 |
| D | Test Doc | Plan (case list) → Report (results, coverage) | Plan: P3 · Report: P10 |
| B | Traceability Matrix | spec ↔ test ↔ code ↔ pass — coverage proof | P5 draft → P10 fill |
| C | Completion Doc | summary, decisions, how-to-run/verify, screenshots, residual gaps | P10–11 |

Full templates and writing guidance: `references/documents.md`. Write artifacts in the user's working language. The matrix (B) is the spine of "did you do it right" — an empty cell is an admission, never hide one.

## Guardrails
- Two human gates are mandatory; never skip them to "save time."
- Never commit or push unless the user explicitly instructs it. Obey the repo's `CLAUDE.md`.
- Never edit user-managed spec files to make them match the code; record deviations where the repo expects them and ask.
- Adjust rigor to scope: a one-function spec needs a lighter touch than a multi-screen feature — but the gates and the resolved-spec rule always hold.

## Resources
- `references/gap-analysis.md` — exhaustive gap taxonomy + questioning patterns
- `references/verification.md` — the 3-layer test stack (logic TDD · Playwright E2E · screenshot baseline) and how to detect/run each
- `references/documents.md` — templates for artifacts A/B/C/D
- `scripts/verify-workflow.js` — Workflow harness for the Phase-10 comprehensive verification fan-out
