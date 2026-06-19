# Artifacts — templates & guidance

The documents are the user's verification surface — they let the user confirm the work without reading all the code. Each is handed over at the gate where it's approved: `resolved-spec.md` at Gate 1; `design.md` + `test-doc.md`(plan) at the Tests gate; `review/r<k>.md` during the review loop; `verify.md` + `completion.md` + filled `traceability.md` + `deferred.md` at Gate 2. **Filenames are descriptive — no cryptic A/B/C letters.**

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
│   ├── working-spec.md   normalized snapshot — the diff baseline for the NEXT version
│   ├── resolved-spec.md
│   ├── design.md         the complete dev doc (Phase 5): files, functions, every behavior
│   ├── traceability.md
│   ├── test-doc.md     (Plan first; Report appended in P11)
│   ├── review/r<k>.md       (ALL review rounds kept — never overwritten)
│   ├── verify.md         comprehensive-verification report (Phase 11)
│   └── completion.md
└── v2/                update run's full artifact set (delta applied)   ← created per update
    └── …
```
**Version = run.** Fresh → `v1`. Each update → next `v(N+1)/` (count existing `v*` dirs). The version folder holds the complete per-run doc set so every spec version's docs are preserved whole (browsable, comparable — not only in git). **Common** files live at the slug root and accumulate across versions: `index.md` (points to latest + lists versions), `CHANGELOG.md`, `source/`, `deferred.md`. An update diffs the new spec against the **latest** `vN/working-spec.md`.

## Gates are document-driven (read this)
**Every hard stop hands the user a Markdown file, not a chat summary.** At each gate: (1) produce/update the artifact MD(s) for that gate in the doc home; (2) tell the user the **exact path(s)**; (3) ask them to **read the file and approve, or edit it directly** (their edits ARE the approved version — read them back); (4) proceed only after approval. Chat Q&A is only for *gap resolution* (Phase 3 questions) — every *gate approval* is on a file the user can open, diff, and edit. Approved files persist in the doc home; **review rounds and any re-approved versions are all kept, never overwritten** (git history + per-round sections are the trail).
`working-spec.md` is written in Phase 1 (overwritten each update) — the machine-facing normalization, while A is the user-approved contract. `CHANGELOG.md` is the running record of *what each run set out to do and did* (one entry per fresh/update run); `index.md` is the one-screen pointer to everything.

---

## index — overview / manifest
Written first in Phase 1 and updated as artifacts land and on each update run. The one-screen entry point to a feature's run.

```markdown
# <feature> — spec-to-code
slug: <slug>
source: <original spec path(s)/link(s)>
status: <in progress @ Phase N | complete | blocked>

## Artifacts
- [working-spec](working-spec.md) · [A resolved spec](resolved-spec.md) · [B traceability](traceability.md)
- [C completion](completion.md) · [D test doc](test-doc.md) · [E review](review/r<k>.md) · [F deferred](deferred.md)

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

## Resolved Spec (resolved-spec.md)
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

## design.md — the complete dev doc (Phase 5)
The exhaustive design the user approves **before any tests or code**. It must carry *everything needed to build*: a reader should be able to implement from this alone. Hand over the path; the user reads/edits/approves the file.

```markdown
# Design — <feature>
slug: <slug>   from: resolved-spec.md   status: draft | approved <date>

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

## Test Doc (test-doc.md)
Two lives. **Plan** is written in Phase 3 and reviewed at Gate 1 (does this set of cases fully cover A?). **Report** is appended in Phase 10 with results.

```markdown
# Test Doc — <feature>

## Plan
| TID | Case (from A) | Layer (logic/ui-behavior/appearance) | Given/When/Then |
|-----|---------------|--------------------------------------|-----------------|
| T1  | C1 | logic | given empty cart, when add item, then total = price |
| T2  | C3 | ui-behavior | given error state, when render, then banner visible |
| T3  | C5 | appearance | loaded list matches baseline |

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

## Traceability Matrix (traceability.md)
The coverage proof — one row per spec case, drafted in Phase 5 (status `TODO`) and filled in Phase 10. An empty cell means unfinished work; never hide one.

```markdown
# Traceability — <feature>
| Case (A) | Test(s) (D) | Code unit | Status |
|----------|-------------|-----------|--------|
| C1 | T1 | cart.addItem() @ lib/cart.ts | ✅ |
| C2 | T4 | cart.removeItem() | ✅ |
| C3 | T2 | <ErrorBanner> | ✅ |
| C4 | — | — | ⚠️ TODO |
```
Done = zero `TODO`/`—` rows for in-scope cases. Out-of-scope deferrals must be stated, not blank.

---

## Review (per-round files, `v<N>/review/r<k>.md`)
The Phase-10 review loop. **Each round is a separate file** produced by an **independent reviewer** (a fresh subagent — never the author/main loop) that re-reads the *current* code: `review/r1.md`, `review/r2.md`, … All kept; never edit a prior round's file. Write each like a **real PR review** (bar = GitHub `@claude review`): findings **grouped by severity**, each with **exact `file:line`, the offending code snippet, why it matters, the fix as code** — plus a "what's good" section and a one-line summary. Not a terse table. (A round is a genuine re-run, not an edit asserting "fixed".)

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

## verify.md — comprehensive verification report (Phase 11)
Produced after the review loop passes, handed to the user before Gate 2. Reports the conformance/coverage/separation audit + full-suite result.

```markdown
# Verify — <feature>   date: <>

## Suite
- runner: <vitest/node --test/…>   result: <N/M pass>   coverage: <if any>

## Conformance (every spec-case exercised & asserted)
| spec-case | test | asserted? | verdict |
|--------|------|-----------|---------|
| C1 | T1 | yes | ✅ |

## Traceability (B) — no TODO/empty rows
- <status; list any deferred rows>

## Logic/UI separation
- <logic free of UI imports? UI thin? findings>

## Result
- <pass — ready for Gate 2 | issues found → back to fix>
```

## Completion Doc (completion.md)
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
