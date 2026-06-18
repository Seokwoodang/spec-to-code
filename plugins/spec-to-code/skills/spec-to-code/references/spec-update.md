# Update mode — applying a spec revision to existing code

The main flow assumes a spec received for the first time (greenfield). But specs get revised: the planner changes a requirement after code already exists, tested and reviewed. Re-running the full 12-phase flow from scratch is wrong — apply a **delta**. This is detected automatically and changes the path.

## Detecting the mode (Phase 1)

After ingesting and normalizing the new spec, list the existing slugs under `docs/spec-to-code/` and check the matching doc home (`docs/spec-to-code/<slug>/`):
- `working-spec.md` + prior artifacts (at least `A-resolved-spec.md`) exist for this feature → **UPDATE mode**.
- Nothing there → **FRESH mode** (the main flow).

**Identifying the right slug is the crux** — a revision often arrives as a differently-named file (`feature-x-v2.html`) with no obvious link to the original. Match by feature title/scope, and when ambiguous, **ask the user which feature this revises** rather than guess; a wrong match diffs against the wrong baseline and corrupts everything downstream. If a brand-new feature happens to resemble an existing slug, keep them separate.

In update mode, two saved files do the heavy lifting: the **`working-spec.md` snapshot** is the baseline to diff against (the user's original file may have moved or been a transient paste), and the prior **Traceability Matrix (B)** maps every spec case to its tests, code, and screenshots, so impact analysis is a reverse lookup rather than a re-read of the whole codebase.

## The delta path

### U1 — Ingest new spec + load priors
Normalize the new spec (any format — `references/spec-ingestion.md`). Load prior A/B/C/D/E/F and the saved **`working-spec.md`** snapshot (the baseline to diff against). **Re-check Artifact F**: for each open blocked/deferred item, ask whether its revisit trigger has now fired (e.g. the backend endpoint shipped, the milestone arrived). Promote any now-unblocked item into this update's scope; leave the rest parked with their triggers intact.

### U2 — Spec diff
Compare the saved `working-spec.md` (old) vs the newly normalized spec (new) and classify each requirement change. Ignore pure wording/format churn. After resolution, overwrite `working-spec.md` with the new normalized spec so the next update diffs against the latest.
- **Added** — new requirement/case/state/error not present before.
- **Modified** — a decided behavior changed (different value, different transition, different copy with behavioral meaning).
- **Removed** — a requirement deleted.
Produce a change list; each entry is the unit of work for the rest of the path.

### U3 — Impact analysis (via Matrix B)
For each change, reverse-look-up Matrix B to find the affected **A-cases → tests → code units → screenshots**. The union is the **impact set** — what must change, plus what must be re-verified for regression.
- Re-surface any prior **assumptions/deviations recorded in A** that the new spec now touches — ask the user whether to keep the deviation or correct it to the new spec (do not auto-decide). This mirrors a healthy spec-update discipline: a previously-accepted deviation is not automatically valid under a new spec.

### U4 — Delta gap analysis + Gate 1
Added/modified requirements may introduce new gaps — run gap analysis on the delta only and resolve with the user. Then **Gate 1 (hard stop) on the delta**: present the changed decisions (updated A) + changed test plan (updated D) for approval before touching code.

**Deferring a delta change ("changed in the spec, but not now"):** at this gate the user may decide a changed/added requirement should not be built yet. That decision is not a silent skip — it goes to **Artifact F** with a concrete revisit trigger (same no-silent-drop rule as the main flow), its planned test is marked skipped/pending pointing to the F id, and its Matrix-B row is marked `deferred`. **Critical:** the `working-spec.md` snapshot is still overwritten with the *new* spec (it records what the spec now says), so the deferral would be invisible to the next diff — F + the `deferred` B-row are the only record that the code lags the spec here. They are re-checked at U1 of every future update.

### U5 — Update artifacts (keep history)
- **A**: revise the affected decisions; append a dated changelog entry (what changed, why) rather than silently overwriting — the history is audit trail.
- **D**: add test cases for added/modified behavior; mark tests for removed requirements for deletion; mark deferred-delta tests skipped/pending with the F reference.
- **B**: re-map changed rows; add rows for new cases; remove rows for deleted cases; mark deferred-delta rows `deferred`.
- **F**: append the deferred delta items (and any newly-blocked work surfaced during the update), each with its revisit trigger.

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
