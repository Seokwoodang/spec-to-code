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

Stop legend: 🔴 = hard stop in **both** modes · 🟠/🟡 = additional stop in **step-through** only · — = never stop (show output, continue).

| # | Phase | Output | Stop |
|---|-------|--------|------|
| 1 | Ingest & probe | normalized working spec + env facts (runner, UI?, Playwright?) | — |
| 2 | Gap analysis | gap list (exhaustive) | — |
| 3 | Gap resolution | **A. Resolved Spec** + **D. Test Plan** | → 4 |
| 4 | **🚪 Gate 1** | user approves A + D | 🔴 |
| 5 | Design | layer split (logic / UI) + **B. Traceability Matrix** (draft) | 🟠 |
| 6 | Tests first | logic unit tests + UI behavior tests — **RED** | 🔴 |
| 7 | Implement logic | logic tests **GREEN** | 🟡 |
| 8 | Implement UI | UI behavior tests **GREEN** | 🟡 |
| 9 | Visual verify | Playwright screenshots → baseline candidates | 🟠 |
| 10 | **🔁 Review loop** | **E. Review Doc**; review → user → fix → re-review until pass | 🔴 |
| 11 | Comprehensive verify | fill **B**; spec-conformance + full suite + separation audit | — |
| 12 | **🚪 Gate 2** | report **C** + **D**(report) + **B** + **E** + **F** + screenshots | 🔴 |

## Checkpoint modes
Two modes control *how often* the flow stops for the user. Both **never** stop on the low-value mechanical phases (1, 2, 11 — show output and continue) and both run the **Review loop (10) WITH the user** (it is never run solo).

- **checkpoint (default)** — stops at the **4 🔴 phases only**; each stop also surfaces the preceding 🟠/🟡 work, folded in:
  1. **Gate 1** (phase 4) — resolved spec + test plan ("building the right thing?")
  2. **Tests gate** (phase 6) — surfaces the design (5) **and** the RED tests together; approved *before any implementation* ("how, and how it's verified?")
  3. **Review loop** (phase 10) — surfaces the implemented code (7–9, + screenshots if UI) and runs the review *with the user*
  4. **Gate 2** (phase 12) — final completion
- **step-through** — additionally stops at **5, 7, 8, 9** on their own (so: 4, 5, 6, 7, 8, 9, 10, 12). Maximum control, more stops. Still skips 1/2/11.

Selection: default is **checkpoint**. The user can request step-through ("꼼꼼히 가자 / 단계별로 / step through") at the start or mid-run. Phases marked 🟠/🟡 are *shown* in checkpoint mode (folded into the next gate) and *stopped on* in step-through.

**Why not stop at every phase:** too many hard stops breed rubber-stamping — the user clicks through without reading and the gate becomes approval theater (false confidence, worse than fewer real gates). Stops live where the user's judgment changes the outcome and a wrong call is expensive to undo.

## Gates are document-driven (not chat)
**Every hard stop hands the user a Markdown file at a known path — never a chat-summary table.** At each gate:
1. **Produce/update the gate's artifact MD** in the doc home (e.g. `DESIGN.md` at the design gate, `D-test-doc.md` at the tests gate, `E-review.md` round at the review loop, `VERIFY.md` after comprehensive verify).
2. **Tell the user the exact path** and ask them to **read it and approve, or edit the file directly** — their edits ARE the approved version; read them back.
3. **Proceed only after approval.** Re-edits produce a new version/round; **all versions are kept, never overwritten** (per-round sections + git history).

Chat Q&A (incl. `AskUserQuestion`) is for **gap resolution only** (Phase 3). Every **gate approval is on a file** the user can open, diff, and edit. This is non-negotiable: surfacing decisions as chat tables instead of approvable files defeats the flow.

## Phase detail

### 1 — Ingest & probe
**Ingest:** specs arrive in any format — markdown, HTML/mockup, PDF, image/Figma export, `.docx`, URL, or pasted text. Detect the format and normalize it into one analyzable **working spec**, preserving a pointer to each source. For visual sources (HTML/image/Figma), also capture a **visual notes** block (layout, component hierarchy, states) for the UI layer. Lossy formats (a screenshot, a happy-path mockup) omit behavior — those omissions are gaps, fed straight to Phase 2. See `references/spec-ingestion.md`.

**Feature identity & snapshot:** establish a stable **`<slug>`** for the feature — lowercase kebab-case from its name (e.g. `cart-bulk-delete`); confirm with the user. The slug names the doc home `docs/spec-to-code/<slug>/` (or nest under the repo's own docs convention; decide once). Persist three things: **archive the user's original spec verbatim** into `source/<date>-original.<ext>` (a *copy* — the original stays put; a paste is saved as `.md`, a URL as its fetched snapshot); **save the normalized `working-spec.md`** (header points to the archived original); create **`index.md`** (manifest) and open a **`CHANGELOG.md`** entry for this run (fresh seeds "initial build"; update records the diff + task checklist — see Modes). The diff baseline for updates is `working-spec.md` (normalized, always comparable); the archived originals exist for fidelity-checks and re-normalization.

**Open the gate-guard state.** Write `.spec-to-code-state.json` at the project root: `{"active":true,"slug":"<slug>","tier":"full|lite","gateApproved":false,"docHome":"docs/spec-to-code/<slug>"}`. While this marks an active, unapproved run, the bundled PreToolUse hook **blocks edits to code/test files** (doc-home artifacts and the state file stay editable) — so the gate cannot be skipped. See Enforcement below. This snapshot — not the user's original file, which stays wherever they keep it — is what a later update diffs against. Never move or edit the user's original spec; only reference it. All artifacts are Markdown in the doc home; code/tests stay in the project's conventional locations. See `references/documents.md` for the authoritative storage/naming/format rules and templates.

**Probe** (project-agnostic — detect, do not assume): test runner (`vitest`/`jest`/`pytest`/`go test`…); whether a renderable UI exists or it's CLI/library (decides if UI layers apply); Playwright presence (if a UI exists but it's absent, *offer* to add it — never install silently); doc home location (default `docs/spec-to-code/<slug>/`, else match the repo convention). **Read the repo's `CLAUDE.md` and obey it** — especially "never commit without explicit instruction" and "don't touch spec files."

**Mode:** list existing slugs under `docs/spec-to-code/`. If one holds prior artifacts (`working-spec.md` + ≥ `A-resolved-spec.md`) for **this** feature, it is an **UPDATE** — diff the new working spec against the saved `working-spec.md` and follow `references/spec-update.md` (impact-analyze via Matrix B, resolve delta gaps, delta TDD, **regression**), then overwrite the snapshot. Otherwise it is **FRESH** — continue below. If it's ambiguous which slug a revision targets (e.g. the new spec file is named differently), **ask the user** rather than guess; a wrong match corrupts the diff.

**Deferred check (proactive, on every resume):** whenever a run targets a feature whose `F-deferred.md` has open items, **surface them up front and ask the user which to take on now** — before proceeding. Do not leave a "not now" silently parked across sessions. This fires on *any* resumption — an update run, or simply returning to the feature with no spec change — so every deferral is actively revisited with the user, never forgotten. Flag items whose revisit trigger has plausibly fired (e.g. the blocking backend endpoint now exists). Items the user again defers stay in F with their triggers; items picked up join this run's scope.

**Tier (full vs lite):** run a **quick gap scan** (inline, not the exhaustive fan-out) to size the change, then pick the tier — **lite** for small, low-risk changes (zero blocker gaps, no new external dependency, small blast radius, e.g. "add one more button"); **full** otherwise. The user may request lite explicitly; honor it unless the scan finds a blocker, then escalate. Lite collapses the flow to 4 steps / 1 gate / a single CHANGELOG entry while keeping the safety core (user-resolved gaps, test-first, regression, no unprompted commit) — see `references/lite-mode.md`. If a lite run proves bigger than it looked, **escalate to full** mid-run and tell the user. The rest of this document is the **full** flow.

### 2 — Gap analysis
Enumerate everything needed for *complete* code that the working spec does not pin down. Be exhaustive, not polite. See `references/gap-analysis.md` for the taxonomy (states, transitions, edge values, error/failure modes, empty/loading/boundary, concurrency, permissions, i18n, a11y, non-functional). For a large/multi-section spec, fan out the *reading* with the bundled **`gap-hunter`** agent (`subagent_type: 'gap-hunter'`) — one per section, distinct lenses — else `Explore`/inline. Resolution stays interactive.

### 3 — Gap resolution
Group gaps into a few decision questions and put them to the user (`AskUserQuestion` for crisp choices; prose for open ones). Batch — never drip one at a time. As answers land, write **Artifact A (Resolved Spec)** and derive **Artifact D (Test Plan)**. Loop until zero open gaps and every requirement maps to a planned test. Templates: `references/documents.md`.

### 4 — 🚪 Gate 1 (hard stop)
Present A + D; get explicit approval before any code. **Only after the user approves**, set `gateApproved: true` in `.spec-to-code-state.json` — this is what unblocks code/test edits (the gate guard enforces it). If a decision changes, update A + D and re-present.

### 5 — Design · 🟠
Write **`DESIGN.md` — the complete dev doc**: approach, the logic/UI split, **every file with its path**, data models/types, **the full function list with signatures + behavior**, an exhaustive **behavior spec** (every interaction — e.g. button-click branch by branch — every state, transition, edge, and error path), and integration points. A developer must be able to build from this alone. Also draft **Artifact B (Traceability Matrix)** (`TODO` rows). **Hand over the path** (`docs/spec-to-code/<slug>/DESIGN.md`) and have the user read/edit/approve the file. (Step-through: approve DESIGN here on its own; checkpoint: approved together with the RED tests at the Tests gate.)

### 6 — Tests first (RED) · 🔴 Tests gate
Write planned tests before implementation: logic unit tests + UI-behavior tests (state→view, interactions, error display). They must fail for the right reason. Writing them is the final gap detector — a test that can't be written concretely → back to Phase 3. Record them in **`D-test-doc.md`** (Plan section). **Hard stop (both modes):** hand over the paths — `DESIGN.md` (if not yet approved) **and** `D-test-doc.md` — and have the user read/edit/**approve the files** *before writing any implementation*. The tests are the executable spec, so approving them largely determines the code.

### 7–8 — Implement to GREEN
Logic until logic tests pass; then thin UI over the tested logic until UI-behavior tests pass. Keep the split intact. (Step-through: stop after each to show the code; checkpoint: surfaced together at the Review loop.)

### 9 — Visual verify
For UIs, run the app and capture Playwright screenshots per state — *baseline candidates* the user blesses at Gate 2, then guarded by `toHaveScreenshot()`. Baselines live where Playwright stores them (its `*-snapshots/` dirs beside the e2e tests) and are committed; C links to them. See `references/verification.md`.

### 10 — 🔁 Review loop (iterative gate)
Run an AI code review over the diff with the bundled **`code-reviewer`** agent (`subagent_type: 'code-reviewer'`): spec-faithfulness (vs Artifact A) + correctness/bugs, edge cases, security, simplification/reuse, convention adherence, logic/UI separation. Then loop **with the user, document-driven**:
1. Write the round's findings (red→green flags, each with location + evidence) as a **new round section in `E-review.md`** and **hand over the path**. The user reads the file and marks each finding accept / reject / defer **in/on the doc** (or tells you).
2. Apply accepted fixes.
3. Re-review the updated diff → **append a new round** to `E-review.md` (reuse ids; mark resolved). **Never overwrite prior rounds — all are kept.**
4. Repeat until no open `blocker`/`major` findings **and** the user approves the latest review doc.

Do not proceed to Phase 11 until the loop passes. This is the user's "review → comment → re-review → pass → next" checkpoint. **This is a 🔴 hard stop in both modes and is NEVER run solo** — presenting findings and dispositioning them yourself defeats the entire flow. The user dispositions every finding; you only produce them and apply the accepted fixes.

### 11 — Comprehensive verify
Run the full suite, then audit: conformance (every Artifact-A case demonstrably covered), traceability fully filled (no `TODO` rows — empty cells = unfinished work, say so), logic/UI separation. Good Workflow fan-out (conformance/coverage/separation as parallel dimensions, each adversarially checked by the **`spec-verifier`** agent) — see `scripts/verify-workflow.js`. Only call Workflow if multi-agent orchestration is opted into; else audit inline. Write the result to **`VERIFY.md`** and hand the user the path (this is produced only after the review loop has been approved).

### 12 — 🚪 Gate 2 (hard stop)
Compile **C (Completion Doc)** + **D (Test Report)** + filled **B** + **E (Review Doc)** + **F (Deferred & Blocked)** + screenshots, and report. The user reviews docs, not raw code. Surface the open F items (what's parked + revisit triggers) and any residual assumptions explicitly. Wait for approval. Never commit unless explicitly told. On completion (or if the user abandons the run), set `active: false` in `.spec-to-code-state.json` so the gate guard goes dormant.

## The artifacts (each gate hands one over)

| Doc | Purpose | Written | Approved at |
|-----|---------|---------|-------------|
| A · Resolved Spec | every decision/case/edge/error pinned down | P3 | Gate 1 |
| **DESIGN** | complete dev doc — files, functions, every behavior | P5 | Tests gate |
| D · Test Doc | Plan (case list) → Report (results, coverage) | Plan P6 · Report P11 | Tests gate |
| B · Traceability Matrix | spec ↔ test ↔ code ↔ pass — coverage proof | P5 draft → P11 fill | — |
| E · Review Doc | code-review findings, **all rounds kept**, user dispositions | P10 | Review loop |
| **VERIFY** | comprehensive-verification report | P11 | (read before Gate 2) |
| C · Completion Doc | summary, decisions, how-to-run, screenshots, residual | P11–12 | Gate 2 |
| F · Deferred & Blocked | parking lot — blocked/deferred/out-of-scope + triggers | any phase (living) | — |

Full templates: `references/documents.md`. Write artifacts in the user's working language. Matrix B is the spine of "did you do it right" — an empty cell is an admission, never hide one.

**No silent drop:** anything that cannot be done now or is postponed goes to **Artifact F** the moment it arises (a deferred gap, a `defer`-dispositioned review finding, work blocked on a backend/external dependency, an out-of-scope discovery). Each F entry carries a concrete revisit trigger. If a parked item maps to an A-case, its test is marked skipped/pending with a reason pointing to the F id and its B-row is marked `deferred` — never quietly passed or blank.

## Enforcement (gate guard)
The checkpoints are not just convention — a bundled **PreToolUse hook** (`hooks/gate-guard.mjs`) makes them structural. While `.spec-to-code-state.json` marks an **active** run with `gateApproved: false`, the hook **blocks `Edit`/`Write`/`MultiEdit` on code/test files** (the doc home and the state file stay writable, so artifacts can be authored). Flipping `gateApproved: true` happens *only* after the user approves Gate 1 (or lite's L2). The guard is **scoped and fail-open**: with no active state file it is a complete no-op, so it never interferes with ordinary work in any repo, and any guard error allows the edit rather than blocking. This is what stops the flow (or a hurried Claude) from writing code before the spec is resolved. Lifecycle: create state in Phase 1 → `gateApproved:true` at Gate 1 → `active:false` at Gate 2/abort.

## Guardrails
- Three human checkpoints (Gate 1, Review loop, Gate 2) are mandatory; never skip them to "save time." They are also enforced by the gate guard above.
- Never commit or push unless the user explicitly instructs it. Obey the repo's `CLAUDE.md`.
- Never edit user-managed spec files to match the code; record deviations where the repo expects them and ask.
- Scale rigor to scope: a one-function spec is lighter than a multi-screen feature — but the resolved-spec rule and the checkpoints always hold.

## Modes: fresh vs update
This flow runs greenfield **and** for later spec revisions. Phase 1 detects which: prior artifacts in the doc home → **update**; none → **fresh**. The update path (`references/spec-update.md`) diffs old vs new spec, reverse-looks-up Matrix B to find the impacted cases/tests/code, and records the work as a **`CHANGELOG.md` entry whose Tasks checklist is the user-facing "what this update will do"** — presented at the delta Gate 1 for approval. It then resolves only the delta's gaps, does delta TDD, and — critically — runs the **full prior suite as a regression guard** so a revision never silently breaks an existing case. Artifacts A/B/D/F are updated with history kept, and the CHANGELOG tasks are ticked off to completion. The checkpoint discipline and the resolved-spec rule are identical; only the scope narrows to the delta + regression.

## Tiers: full vs lite
Orthogonal to fresh/update. **Full** (this document's 12 phases) is for large or uncertain work. **Lite** (`references/lite-mode.md`) is for small, well-scoped changes — 4 steps, 1 confirmation gate, a single CHANGELOG entry instead of A–F, inline review, no agent fan-out. Tier is chosen by *scope* (decided by the quick scan in Phase 1), not by mode: a small fresh task and a small update are both lite; a large rework is full. The **safety core never changes** — gaps resolved by the user, test-first, regression on updates, no unprompted commit. A lite run **escalates to full** the moment a blocker, hidden complexity, or unexpected regression appears, so lite never silently swallows a big change.

## Resources
- `references/lite-mode.md` — the lite tier (small changes): L1–L4 path, safety core, escalation bridge
- `references/spec-ingestion.md` — normalizing any input format (md/HTML/PDF/image/Figma/docx/URL)
- `references/spec-update.md` — update mode: applying a spec revision to existing code (delta + regression)
- `references/gap-analysis.md` — exhaustive gap taxonomy + questioning patterns
- `references/verification.md` — the 3-layer test stack (logic TDD · Playwright E2E · screenshot baseline)
- `references/documents.md` — templates for artifacts A/B/C/D/E/F
- `scripts/verify-workflow.js` — Workflow harness for the Phase-11 comprehensive verification fan-out
- Bundled agents (when installed via the plugin): **`gap-hunter`** (P2 gap reading), **`code-reviewer`** (P10 review loop), **`spec-verifier`** (P11 adversarial verify). The skill degrades gracefully to `Explore`/inline if absent.
