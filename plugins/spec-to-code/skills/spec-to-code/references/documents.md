# Artifacts — templates & guidance

Four documents are the user's verification surface. They let the user confirm the work without reading all the code: A + D(plan) at Gate 1, and C + D(report) + B + screenshots at Gate 2. Write them in the user's working language. Store under the doc home chosen in Phase 1 (default `docs/spec-to-code/<feature-slug>/`).

Files:
```
docs/spec-to-code/<slug>/
├── A-resolved-spec.md
├── B-traceability.md
├── C-completion.md
└── D-test-doc.md      (Plan section first; Report section appended in P10)
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

## Screenshots (appearance baselines — need your bless)
- <state>: <path/embed>

## Residual gaps / assumptions / deviations
- <anything not fully closed, or any repo-deviation recorded>

## Open for approval
- [ ] Baselines blessed
- [ ] Approved to commit (skill never commits unprompted)
```

---

## Notes
- Keep A and D in lockstep: every A case has ≥1 D test; every D test traces to an A case.
- If a decision changes after Gate 1, edit A + D and re-present — do not let docs drift from code.
- Match an existing repo doc convention if one exists rather than imposing this layout.
