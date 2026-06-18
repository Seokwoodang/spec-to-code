# Update mode — applying a spec revision to existing code

The main flow assumes a spec received for the first time (greenfield). But specs get revised: the planner changes a requirement after code already exists, tested and reviewed. Re-running the full 12-phase flow from scratch is wrong — apply a **delta**. This is detected automatically and changes the path.

## Detecting the mode (Phase 1)

After ingesting the spec, check the doc home (`docs/spec-to-code/<slug>/`):
- Prior artifacts (at least `A-resolved-spec.md`) exist → **UPDATE mode**.
- Nothing there → **FRESH mode** (the main flow).

Confirm with the user which feature/slug the revision targets if ambiguous. In update mode, the prior **Traceability Matrix (B)** is the key asset — it maps every spec case to its tests, code, and screenshots, so impact analysis is a reverse lookup rather than a re-read of the whole codebase.

## The delta path

### U1 — Ingest new spec + load priors
Normalize the new spec (any format — `references/spec-ingestion.md`). Load prior A/B/C/D/E. Keep the old working spec to diff against.

### U2 — Spec diff
Compare old vs new working spec and classify each requirement change. Ignore pure wording/format churn.
- **Added** — new requirement/case/state/error not present before.
- **Modified** — a decided behavior changed (different value, different transition, different copy with behavioral meaning).
- **Removed** — a requirement deleted.
Produce a change list; each entry is the unit of work for the rest of the path.

### U3 — Impact analysis (via Matrix B)
For each change, reverse-look-up Matrix B to find the affected **A-cases → tests → code units → screenshots**. The union is the **impact set** — what must change, plus what must be re-verified for regression.
- Re-surface any prior **assumptions/deviations recorded in A** that the new spec now touches — ask the user whether to keep the deviation or correct it to the new spec (do not auto-decide). This mirrors a healthy spec-update discipline: a previously-accepted deviation is not automatically valid under a new spec.

### U4 — Delta gap analysis + Gate 1
Added/modified requirements may introduce new gaps — run gap analysis on the delta only and resolve with the user. Then **Gate 1 (hard stop) on the delta**: present the changed decisions (updated A) + changed test plan (updated D) for approval before touching code.

### U5 — Update artifacts (keep history)
- **A**: revise the affected decisions; append a dated changelog entry (what changed, why) rather than silently overwriting — the history is audit trail.
- **D**: add test cases for added/modified behavior; mark tests for removed requirements for deletion.
- **B**: re-map changed rows; add rows for new cases; remove rows for deleted cases.

### U6 — Delta TDD
- **Added/modified**: write/adjust tests first. For *modified* behavior, the existing test should now fail (it encodes the old behavior) — update it to the new expectation and confirm RED, then change code to GREEN.
- **Removed**: delete the obsolete tests and the code that served only them; confirm nothing else depended on it.
- Touch only the impact set; do not opportunistically rewrite untouched code.

### U7 — Regression (the critical guard)
Run the **full prior suite**. Everything must still pass **except** the tests that were intentionally changed/removed for this delta — and those must be called out explicitly so the user sees the behavior change was deliberate, not an accident. A surprise red in an untouched area means the delta had unintended blast radius — stop and investigate.

### U8–U10 — Review loop · comprehensive verify · Gate 2
Same as the main flow, scoped to the delta plus regression:
- **Review loop**: review the diff (the touched files) with `code-reviewer`, append a new round to E.
- **Comprehensive verify**: conformance is checked against the **new full A** (not just the delta) so nothing fell through; confirm Matrix B has no orphan/`TODO` rows; regression intact.
- **Gate 2**: report the completion package highlighting *what changed*, the regression result, and any deviations re-confirmed.

## Watch for
- **Silent regressions** — the whole point of update mode. The prior suite is the safety net; never skip it.
- **Stale artifacts** — if A/B/D drift from the code after an update, future updates lose their impact-analysis map. Keep them in lockstep.
- **Cascading gaps** — a modified requirement can invalidate a decision elsewhere in A. Check the impact set for second-order effects, not just direct hits.
- **No prior artifacts but code exists** — if someone built the feature without this flow, there is no B to reverse-look-up. Offer to back-fill A/B from the existing code+tests first, then proceed as an update.
