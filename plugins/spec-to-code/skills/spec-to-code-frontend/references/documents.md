# Artifacts — templates & guidance

The documents are the user's verification surface — they let the user confirm the work without reading all the code. Each is handed over at the gate where it's approved: `02-resolved-spec.md` at Gate 1; `03-design.md` + `04-test-doc.md`(plan) at the Tests gate; `06-review/r<k>.md` during the review loop; `07-verify.md` + `08-completion.md` + filled `05-traceability.md` + `deferred.md` at Gate 2. **Filenames are descriptive — no cryptic A/B/C letters.**

## Storage, naming & format (authoritative)

- **Where** — all artifacts live in the feature's **doc home**: `docs/spec-to-code/<slug>/` by default. If the repo has its own docs convention (e.g. a top-level `doc/` tree), nest the home under it instead; decide once in Phase 1 and keep it stable.
- **Slug** — lowercase **kebab-case**, derived from the feature name, ≤ ~40 chars (e.g. `cart-bulk-delete`). This is the feature's identity for update detection; never rename it across updates.
- **Format** — every artifact is a single **Markdown** file (`.md`) following the templates below. Write prose in the user's working language, but keep table headers/keys as shown so the docs stay machine-parseable on later runs.
- **Screenshots** — Playwright baselines live where the test framework puts them (alongside the e2e tests, in its `*-snapshots/` dirs) and are committed to the repo; **C links to them**, images are not copied into the doc home.
- **Code & tests** — go in the **project's own conventional locations** (detected in Phase 1), never the doc home. The doc home holds documents only.

Files (doc home) — **versioned by spec version**:
```
docs/spec-to-code/<slug>/
├── index.md           COMMON: status + version list + link to latest
├── CHANGELOG.md       COMMON: run log across all versions
├── source/            COMMON: verbatim original archive (<date>-original.<ext>)
├── deferred.md      COMMON: parking lot (carries across versions, living)
├── v1/                fresh run's full artifact set
│   ├── 00-gap-analysis.md   filled grid (axes + decision/state×event tables) — Phase 2, MANDATORY, hook-gated before 02
│   ├── 01-working-spec.md   normalized snapshot — the diff baseline for the NEXT version
│   ├── 02-resolved-spec.md
│   ├── 03-design.md         the complete dev doc (Phase 5): files, functions, every behavior
│   ├── 05-traceability.md
│   ├── 04-test-doc.md     (Plan first; Report appended in P11)
│   ├── 06-review/r<k>.md       (ALL review rounds kept — never overwritten)
│   ├── 07-verify.md         comprehensive-verification report (Phase 11)
│   └── 08-completion.md
└── v2/                update run's full artifact set (delta applied)   ← created per update
    └── …
```
**Version = run.** Fresh → `v1`. Each update → next `v(N+1)/` (count existing `v*` dirs). The version folder holds the complete per-run doc set so every spec version's docs are preserved whole (browsable, comparable — not only in git). **Common** files live at the slug root and accumulate across versions: `index.md` (points to latest + lists versions), `CHANGELOG.md`, `source/`, `deferred.md`. An update diffs the new spec against the **latest** `vN/01-working-spec.md`.

## Gates are document-driven (read this)
**Every hard stop hands the user a Markdown file, not a chat summary.** At each gate: (1) produce/update the artifact MD(s) for that gate in the doc home; (2) tell the user the **exact path(s)**; (3) ask them to **read the file and approve, or edit it directly** (their edits ARE the approved version — read them back); (4) proceed only after approval. Chat Q&A is only for *gap resolution* (Phase 3 questions) — every *gate approval* is on a file the user can open, diff, and edit. Approved files persist in the doc home; **review rounds and any re-approved versions are all kept, never overwritten** (git history + per-round sections are the trail).
`01-working-spec.md` is written in Phase 1 (overwritten each update) — the machine-facing normalization, while 02-resolved-spec.md is the user-approved contract. `CHANGELOG.md` is the running record of *what each run set out to do and did* (one entry per fresh/update run); `index.md` is the one-screen pointer to everything.

---

## index — overview / manifest
Written first in Phase 1 and updated as artifacts land and on each update run. The one-screen entry point to a feature's run.

```markdown
# <feature> — spec-to-code
slug: <slug>
source: <original spec path(s)/link(s)>
status: <in progress @ Phase N | complete | blocked>

## Artifacts
- [working-spec](01-working-spec.md) · [resolved-spec](02-resolved-spec.md) · [traceability](05-traceability.md)
- [completion](08-completion.md) · [test-doc](04-test-doc.md) · [review](06-review/r<k>.md) · [deferred](deferred.md)

## Run history
- <date> — fresh: <one line>
- <date> — update: <what changed>
```

---

## CHANGELOG — per-run plan & record
The answer to "what has to be done for this update, and what was done." One entry per run (newest on top). In **update** mode it is written during U2–U5 and its **Tasks checklist is shown at the delta Gate 1** as the work plan to approve, then ticked off as the run proceeds and closed with the regression result. A **fresh** run seeds the first entry (the initial build). This is the audit trail of the feature's evolution; `index.md` links here.

```markdown
# Change Log — <feature>

## <date> · update — <status: planned | in progress | done>
### Spec diff (vs prior working-spec)
- modified: <C-id> — <what changed, old → new>
- added: <new requirement>
- removed: <requirement>
### Impact (reverse-lookup via the traceability matrix)
| change | spec-case | test(s) | code unit | screenshots |
|--------|--------|---------|-----------|-------------|
| modify discount cap | C8 | T7 | calcDiscount() | cart-applied |
### Tasks
- [ ] update test T7 to new expectation (RED)
- [ ] change cap logic in calcDiscount()
- [ ] regression: full prior suite
- [ ] update A/B/D, screenshots if visual changed
### Regression
- full suite: <N/M pass>; intentional changes: <T7>; unexpected breakage: <none | …>
### Deferred (→ F)
- <item> — revisit when <trigger>

## <date> · fresh — done
- initial build: <one line>; <N> cases, <M> tests.
```
The Tasks list is the literal "to-do for this update." Keep it honest — an unchecked box at Gate 2 means the update isn't complete (or the item moved to F with a reason).

---

## Gap Analysis (00-gap-analysis.md)
The **mandatory** Phase-2 grid, written **before** the resolved spec (the hook blocks `02` until this exists). Its job: turn "did we think of every case?" into "is any cell empty?". Not gated on spec size.

```markdown
# Gap Analysis — <feature>
slug: <slug>   phase: 2   fan-out: <ran N gap-hunters per section | inline (below threshold)>

## Axis checklist (every axis explicitly TICKED or marked N/A — forces recall of the one thing the grid can't: a forgotten axis)
- [ ] states (empty/loading/loaded/error/offline/unauthorized/disabled)
- [ ] inputs + boundaries (0/1/many, min/max/over-max, empty/whitespace/unicode/very-long)
- [ ] roles / permissions
- [ ] external-call outcomes (ok/empty/error/timeout/partial)
- [ ] navigation & persistence (refresh, deep-link, back mid-flow, what survives reload)
- [ ] concurrency / timing (double-submit, race, stale response, optimistic vs pessimistic)
- [ ] a11y (focus, keyboard, labels, dialog semantics)
- [ ] i18n (strings, plural, RTL)  ·  [ ] responsive / breakpoints
- [ ] performance limits  ·  [ ] feature flags / rollout  ·  [ ] security / authz
> Any box left unticked without an explicit N·A is itself a gap. The grid below enumerates combinations *within* these ticked axes.

## Decision table(s)
| <condition A> | <condition B> | … | → action / result |
|---|---|---|---|
| … | … | | <decided behavior, or **GAP→Q#**> |

## State × event matrix
| state \ event | <ev1> | <ev2> | … |
|---|---|---|---|
| <state1> | <next/effect> | <next/effect> | |
| <state2> | … | | |

## Branch-complement checklist (every "when X" → its "not-X")
- [x] when X → A · NOT-X → <decided / GAP→Q#>
- [ ] …

## Adversarial completeness critic
- ran: <yes>  ·  findings: <empty cells / missing axes / uncomplemented branches found> → folded in / parked (F#)

## Open gaps → Gate-1 questions
- Q1 (<axis/cell>, severity): <question>
```
**Exit:** zero empty cells (each is a decision or a flagged GAP), critic run, every branch complemented, every resolved item test-shaped. These open Q's flow into the resolved spec's Decisions table.

## Resolved Spec (02-resolved-spec.md)
The contract. Every gap from Phase 2, with the user's decision. This — not the original spec — is what the code implements.

```markdown
# Resolved Spec — <feature>
source spec: <path/link>   resolved: <date>

## Scope
<one paragraph: what is and isn't being built>

## Decisions (gap → resolution)
| # | Gap (category) | Question | Decision | Severity |
|---|----------------|----------|----------|----------|
| 1 | error mode | API 500 on submit? | inline retry banner, stay on form | BLOCKER |
| 2 | empty | list empty copy? | "No items yet" + Create CTA | BEHAVIORAL |

## Assumed defaults (trivial — user may veto)
- <thing>: assumed <X> because <convention>.

## Cases (the testable enumeration)
Each becomes ≥1 test in D. Format as given/when/then.
- C1: given <state>, when <event>, then <result>.
- C2: ...
```

---

## 03-design.md — the complete dev doc (Phase 5)
The exhaustive design the user approves **before any tests or code**. It must carry *everything needed to build*: a reader should be able to implement from this alone. Hand over the path; the user reads/edits/approves the file. *If a built HTML/mockup was the input, §2 also states how its markup/CSS decomposes into components (reuse, don't re-create) and where behavior/state/API attach.*

```markdown
# Design — <feature>
slug: <slug>   from: 02-resolved-spec.md   status: draft | approved <date>

## 1. Approach & architecture
- <overview in 2–4 sentences>
- Layer split: logic (<where>) vs UI (<where>) — what lives in each and why.

## 2. Files (every file to create/modify, with path)
| Path | New/Modify | Purpose |
|------|-----------|---------|
| src/lib/cart/coupon.ts | new | discount engine (pure) |
| src/components/CouponInput.tsx | new | UI: input + apply button |
| ... | | |

## 3. Data models / types
```
type Coupon = { id: string; type: 'fixed'|'percent'; value: number; ... }
type ApplyResult = { discount: number; final: number; ... }
```

## 4. Functions / API (each: signature, params, returns, behavior)
- `applyCoupons(cartTotal, coupons[], wallet?) -> ApplyResult`
  - params: ...   returns: ...   behavior: step by step ...
- `<component>` props/state/handlers ...

## 5. Behavior spec (every interaction & state — be exhaustive)
- **Apply button click**: validate input → call X → on success Y → on error Z (each branch).
- **States**: empty / loading / applied / error / disabled — what shows, what's enabled.
- **Transitions**: double-click, re-apply, remove, refresh — exact behavior.
- **Edge cases**: (enumerate, tie each to an spec-case)
- **Errors**: each failure path → user-visible result.

## 6. Dependencies / integration points
- backend endpoints, libs, existing modules reused.

## 7. Out of scope / open
- (should be none open after Gate 1; list deferrals → F)
```
The detail bar: button behavior, file paths, function list, state machine, error branches — all of it. If a developer would have to guess, it's not done.

## Test Doc (04-test-doc.md)
Two lives. **Plan** is written in Phase 3 and reviewed at Gate 1 (does this set of cases fully cover A?). **Report** is appended in Phase 10 with results.

**Coverage rule — test per CELL, not per case.** The unit of coverage is the **grid cell** from `00-gap-analysis.md` (each equivalence class, boundary value, and branch-complement), NOT the prose case. A case that bundles several classes (e.g. "search matches title/region/dong/type") needs **one test per class + each boundary** — collapsing them into a single test is how coverage silently thins. Cite the originating cell so the Phase-11 verifier can confirm every cell has a test. Boundaries (0/1/many, min/max/over-max, empty/whitespace/unicode), each branch's complement, and each external-call outcome are **separate rows — one assertion each**.

```markdown
# Test Doc — <feature>

## Plan
| TID | Cell (00-grid) | Case (A) | Layer (logic/ui-behavior/appearance) | Given/When/Then |
|-----|----------------|----------|--------------------------------------|-----------------|
| T1  | search·title-match | C5 | logic | given q matches title only, then that listing returned |
| T2  | search·type-match | C5 | logic | given q matches type only, then that listing returned |
| T3  | search·no-match | C5 | logic | given q matches nothing, then [] |
| T4  | sort·empty-list | C8 | logic | given [], when sort, then [] (no throw) |
| T5  | error-state·render | C3 | ui-behavior | given error state, when render, then banner visible |

## Report  (appended P10)
- Runner: <vitest x.y>  |  E2E: <playwright x.y>
- Result: <N passed / M total>, coverage <if available>
| TID | Status | Notes |
|-----|--------|-------|
| T1  | ✅ pass | |
| T2  | ✅ pass | |
| T3  | ⏳ baseline pending user bless | |
- Failures / flakes: <none | details>
```

---

## Traceability Matrix (05-traceability.md)
The coverage proof — **one row per grid cell** (from `00-gap-analysis.md`), not per prose case, drafted in Phase 5 (status `TODO`) and filled in Phase 10. Starting from cells (not cases) is what stops a class from vanishing between the grid and the tests. An empty cell means unfinished work; never hide one.

```markdown
# Traceability — <feature>
| Cell (00-grid) | Case (A) | Test(s) (D) | Code unit | Status |
|----------------|----------|-------------|-----------|--------|
| cart·add-to-empty | C1 | T1 | cart.addItem() @ lib/cart.ts | ✅ |
| cart·remove-last | C2 | T4 | cart.removeItem() | ✅ |
| submit·error-500 | C3 | T2 | <ErrorBanner> | ✅ |
| submit·timeout (complement) | C4 | — | — | ⚠️ TODO |
```
Done = **every grid cell** has a row with no `TODO`/`—` for in-scope cells. A cell with no test is a visible hole. Out-of-scope deferrals must be stated (`deferred`), not blank.

---

## Review (per-round files, `v<N>/06-review/r<k>.md`)
The Phase-10 review loop. **Each round is a separate file** produced by an **independent reviewer** (a fresh subagent — never the author/main loop) that re-reads the *current* code: `06-review/r1.md`, `06-review/r2.md`, … All kept; never edit a prior round's file. Write each like a **real PR review** (bar = GitHub `@claude review`): findings **grouped by severity**, each with **exact `file:line`, the offending code snippet, why it matters, the fix as code** — plus a "what's good" section and a one-line summary. Not a terse table. (A round is a genuine re-run, not an edit asserting "fixed".)

```markdown
# Review — <feature>

## Round 1
reviewer: code-reviewer   scope: <files reviewed>   suite: <N/M green>

전반적으로 <1–2문장 총평>.

### 🔴 Critical — <title>
**`path/to/file.ts:53-63`**
```ts
// the actual offending code, quoted
await admin.from('users').update({ ... }).eq('id', id)
return redirect('/ok')   // ← return value never checked
```
<why it's a bug, concretely — what breaks, when>. Fix:
```ts
const { error } = await admin.from('users').update({ ... }).eq('id', id)
if (error) return redirect(error.code === '23505' ? '/err?dup' : '/err')
```
**disposition:** ☐ fix  ☐ defer(F)  ☐ reject

### 🟡 Improvement — <title>
**`path/file.tsx:20`** — <finding + snippet + suggested code>
**disposition:** ☐ fix  ☐ defer(F)  ☐ reject

### ✅ 잘된 점
- <what's correctly done — migrations, types, integrity checks…>

**요약:** <what must change (critical) vs recommended>.

## Round 2
(re-review after fixes — reuse ids, mark ✅ resolved; never overwrite Round 1)
```

Each finding carries id, severity (`critical/blocker` · `major` · `minor`), `file:line`, the **code snippet**, the **fix as code**, and a **disposition the user sets** (`fix` / `defer(F)` / `reject`). The loop passes only when no open critical/major remain **and** the user approves the latest round. Produce the findings; the user dispositions — never both.

---

## Deferred & Blocked (deferred.md) (parking lot)
The single home for everything that cannot be done now or was consciously postponed — so nothing is silently dropped. A living doc: append to it the moment something is parked, in any phase. Reviewed at Gate 2, and — crucially — **proactively surfaced at the start of every run that resumes the feature**: open F items are presented to the user with the question "take any of these on now?" before work proceeds, so a deferral is never forgotten across sessions.

What lands here:
- gaps the user chose to defer (Phase 3);
- review findings dispositioned `defer` (Phase 10);
- work blocked on something external (backend/API not ready, design pending, upstream decision);
- out-of-scope items discovered mid-flow;
- decisions the user wants to postpone.

```markdown
# Deferred & Blocked — <feature>

| ID | Item | Origin | Reason | Revisit when | Links | Status |
|----|------|--------|--------|--------------|-------|--------|
| F1 | bulk-delete UX | gap P3 | postponed (v2) | next milestone | A:C7 | open |
| F2 | retry on 503 | review R1-4 | blocked-on backend retry header | endpoint ships | A:C3, traceability-row | open |
| F3 | i18n of error copy | P8 impl | out-of-scope this PR | i18n epic | — | open |
```
Reason ∈ `blocked-on <X>` / `out-of-scope` / `postponed` / `needs-decision`. **Revisit when** is a concrete condition or date, never blank — a parked item with no trigger is a lost item.

**No silent drop rule:** if a parked item corresponds to an Artifact-A case, that case does not just vanish — its test is marked skipped/pending *with a reason that points to the F id*, and its traceability row is marked `deferred` (not empty, not passing). An empty B cell still means unfinished; a `deferred` cell means consciously parked and tracked here.

---

## 07-verify.md — comprehensive verification report (Phase 11)
Produced after the review loop passes, handed to the user before Gate 2. Reports the conformance/coverage/separation audit + full-suite result.

```markdown
# Verify — <feature>   date: <>

## Suite
- runner: <vitest/node --test/…>   result: <N/M pass>   coverage: <if any>

## Cell coverage (every 00-grid cell → case → test)
- total cells: <N>  ·  cells with ≥1 test: <N>  ·  uncovered cells: <list — must be empty or deferred(F#)>

## Conformance (every cell exercised & ACTUALLY asserted)
| cell (00-grid) | case | test | asserts the cell? | verdict |
|----------------|------|------|-------------------|---------|
| search·type-match | C5 | T2 | yes — asserts type-only match | ✅ |
- **asserts?** is not "does it pass" — confirm the test would FAIL if the cell's behavior regressed (no trivial/always-green tests). The `spec-verifier` agent defaults to refuting this.

## Traceability (B) — no TODO/empty rows
- <status; list any deferred rows>

## Logic/UI separation
- <logic free of UI imports? UI thin? findings>

## Result
- <pass — ready for Gate 2 | issues found → back to fix>
```

## Completion Doc (08-completion.md)
The post-code report for Gate 2. Lets the user judge "built right" from docs + screenshots.

```markdown
# Completion — <feature>
date: <>   status: awaiting Gate-2 approval

## Summary
<what was built, in 3–5 sentences>

## Key decisions made
<the BLOCKER/BEHAVIORAL resolutions that shaped the code; link to A>

## Architecture — logic / UI split
- Logic: <files, pure, tested by …>
- UI: <files, thin over logic>

## How to run & verify
```
<install / test / e2e commands actually used>
```

## Test results
<paste D Report summary: N/M passing, coverage>

## Review loop
<rounds run; open findings remaining (should be none blocking); link to E>

## Screenshots (appearance baselines — need your bless)
- <state>: <path/embed>

## Deferred / blocked / residual (from F)
- <summarize open F items: what's parked and the revisit trigger; plus any assumptions/deviations recorded>

## Open for approval
- [ ] Baselines blessed
- [ ] Approved to commit (skill never commits unprompted)
```

---

## Notes
- Keep A and D in lockstep: every A case has ≥1 D test; every D test traces to an A case.
- If a decision changes after Gate 1, edit A + D and re-present — do not let docs drift from code.
- Match an existing repo doc convention if one exists rather than imposing this layout.
