# Artifacts — templates & guidance

Six documents (A–F) are the user's verification surface — they let the user confirm the work without reading all the code: A + D(plan) at Gate 1, E during the review loop, F whenever something is parked, and C + D(report) + B + E + F at Gate 2.

## Storage, naming & format (authoritative)

- **Where** — all artifacts live in the feature's **doc home**: `docs/spec-to-code/<slug>/` by default. If the repo has its own docs convention (e.g. a top-level `doc/` tree), nest the home under it instead; decide once in Phase 1 and keep it stable.
- **Slug** — lowercase **kebab-case**, derived from the feature name, ≤ ~40 chars (e.g. `cart-bulk-delete`). This is the feature's identity for update detection; never rename it across updates.
- **Format** — every artifact is a single **Markdown** file (`.md`) following the templates below. Write prose in the user's working language, but keep table headers/keys as shown so the docs stay machine-parseable on later runs.
- **Screenshots** — Playwright baselines live where the test framework puts them (alongside the e2e tests, in its `*-snapshots/` dirs) and are committed to the repo; **C links to them**, images are not copied into the doc home.
- **Code & tests** — go in the **project's own conventional locations** (detected in Phase 1), never the doc home. The doc home holds documents only.

Files (doc home):
```
docs/spec-to-code/<slug>/
├── index.md           overview/manifest — links every artifact + run history (mode, dates, status)
├── working-spec.md    normalized spec snapshot + source pointers — the diff baseline for updates
├── A-resolved-spec.md
├── B-traceability.md
├── C-completion.md
├── D-test-doc.md      (Plan section first; Report section appended in P11)
├── E-review.md        (one section per review round)
└── F-deferred.md      (parking lot — blocked / deferred / out-of-scope, living doc)
```
`working-spec.md` is written in Phase 1 (overwritten each update) — the machine-facing normalization, while A is the user-approved contract.

---

## index — overview / manifest
Written first in Phase 1 and updated as artifacts land and on each update run. The one-screen entry point to a feature's run.

```markdown
# <feature> — spec-to-code
slug: <slug>
source: <original spec path(s)/link(s)>
status: <in progress @ Phase N | complete | blocked>

## Artifacts
- [working-spec](working-spec.md) · [A resolved spec](A-resolved-spec.md) · [B traceability](B-traceability.md)
- [C completion](C-completion.md) · [D test doc](D-test-doc.md) · [E review](E-review.md) · [F deferred](F-deferred.md)

## Run history
- <date> — fresh: <one line>
- <date> — update: <what changed>
```

---

## A — Resolved Spec
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

## D — Test Doc
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

## B — Traceability Matrix
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

## E — Review Doc
The record of the Phase-10 review loop: findings from the `code-reviewer` agent, the user's disposition per finding, and the fixes applied — one section per round. This is what the user reads to drive "review → comment → re-review → pass."

```markdown
# Review — <feature>

## Round 1
reviewer: code-reviewer   reviewed: <diff scope>

| ID | Sev | Dimension | Location | Finding | Disposition |
|----|-----|-----------|----------|---------|-------------|
| R1-1 | blocker | correctness | cart.ts:42 | total ignores discount | accept → fix |
| R1-2 | major | edge case | cart.ts:51 | empty cart → NaN | accept → fix |
| R1-3 | minor | simplify | ui/Cart.tsx:20 | dup of util | reject (intentional) |

fixes applied: R1-1, R1-2.
verdict: 1 round more needed (re-verify R1-1/R1-2).

## Round 2
| ID | Sev | ... | Disposition |
|----|-----|-----|-------------|
| R1-1 | — | | ✅ resolved |
| R1-2 | — | | ✅ resolved |

verdict: no open blocker/major; user signed off → loop passes.
```
Disposition is the user's call per finding: `accept → fix` / `reject (<reason>)` / `defer (<where>)`. The loop passes only when no open `blocker`/`major` remain **and** the user signs off. Carry ids across rounds; mark resolved rather than deleting, so the loop history is visible.

---

## F — Deferred & Blocked (parking lot)
The single home for everything that cannot be done now or was consciously postponed — so nothing is silently dropped. A living doc: append to it the moment something is parked, in any phase. Reviewed at Gate 2, and re-checked at the start of every update run.

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
| F2 | retry on 503 | review R1-4 | blocked-on backend retry header | endpoint ships | A:C3, B-row | open |
| F3 | i18n of error copy | P8 impl | out-of-scope this PR | i18n epic | — | open |
```
Reason ∈ `blocked-on <X>` / `out-of-scope` / `postponed` / `needs-decision`. **Revisit when** is a concrete condition or date, never blank — a parked item with no trigger is a lost item.

**No silent drop rule:** if a parked item corresponds to an Artifact-A case, that case does not just vanish — its test is marked skipped/pending *with a reason that points to the F id*, and its Matrix-B row is marked `deferred` (not empty, not passing). An empty B cell still means unfinished; a `deferred` cell means consciously parked and tracked here.

---

## C — Completion Doc
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
