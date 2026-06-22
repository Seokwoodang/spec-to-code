# Lite tier — small, well-scoped changes

Lite and full are **orthogonal to fresh/update** — the tier is chosen by *scope*, not by mode. Use **lite** for small, low-risk changes ("add one more button", "tweak this number's formatting"); **full** for large or uncertain work. The difference is the amount of ceremony, never the safety core. A small update *and* a small fresh task are both lite; a large rework is full even though it's an update.

## Choosing the tier (end of Phase 1)
After normalizing the spec/change, run a **quick gap scan** — inline, not the exhaustive `gap-hunter` fan-out — just enough to size the change. Then pick:
- **lite** if: zero blocker gaps, no new external dependency, small blast radius (≈ ≤2–3 affected cases / a handful of files; for updates, a small impact set via the traceability matrix).
- **full** otherwise.
- The user may request lite explicitly ("가볍게 가자", "버튼 하나니까"). Honor it — **unless the scan finds a blocker or hidden complexity**, in which case escalate (below). Never take "it's small" purely at face value; the quick scan is what confirms it.

## The lite path (L1–L4)
- **L1 — Ingest & quick scan.** Normalize the spec, archive the original (`source/`), detect mode (fresh/update), surface open `F` items, run the quick scan → decide tier. Write `.spec-to-code-state.json` with `tier:"lite"`, `designApproved:false`, `testsApproved:false` (the gate guard blocks code/test edits until L2). (Same Phase-1 essentials, minus the exhaustive gap fan-out.)
- **L2 — Resolve + confirm (single gate).** Ask the few real gaps (still the user's call — no inventing). Record the decisions + a brief **design note** (files/functions/behavior, scaled to the change) + a **task checklist** in a `CHANGELOG.md` entry. User confirms before any code on the doc; **on confirm set `specApproved`/`designApproved`/`testsApproved` all true** (unblocks code). This one gate replaces the full-tier gates — lite folds design+tests approval into it, but still on a document the user reads.
- **L3 — Test-first + implement.** Write test(s) for the changed behavior (RED → GREEN), keep the logic/UI split. If this is an update, run the **full prior suite as a regression guard**.
- **L4 — Quick review + done.** One inline code-review pass (loop only if it surfaces something real). Tick off the CHANGELOG tasks, record the regression result, brief report. User signs off; set `active:false` in the state file. Commit only if told. This replaces the review loop + comprehensive verify + Gate 2.

## Safety core — never dropped, even in lite
- **gaps resolved by the user** (no invented behavior);
- **test-first** for the changed behavior;
- **regression** on updates;
- **original archived**, mode detected, **deferred (F) items surfaced and re-asked**;
- **never commit unprompted**.

## What lite collapses or drops
| | full | lite |
|---|---|---|
| gap analysis | exhaustive `gap-hunter` fan-out | inline quick scan |
| artifacts | A/B/C/D/E/F + index/working-spec/CHANGELOG/source | **one CHANGELOG entry** (decisions + inline test table + regression) + index/working-spec/source |
| gates | 3 (Gate 1, review loop, Gate 2) | **1** confirm (at L2) |
| code review | iterative loop + `spec-verifier` fan-out | inline single pass |
| screenshots | baseline per state | only if appearance changes |

Deferred/blocked items are still recorded — in the CHANGELOG entry's **Deferred** section — so the no-silent-drop rule holds without a separate `F` file.

## Escalation (lite → full) — the safety bridge
Escalate the moment the change proves bigger than it looked:
- the quick scan or implementation surfaces a **blocker gap, hidden complexity, or wide blast radius**;
- regression breaks something **unexpected**;
- the user asks to go thorough.

On escalation: tell the user plainly ("이거 생각보다 큰데, full로 전환할게요"), expand the single CHANGELOG entry into the full artifact set (A/B/D…), and resume the full flow from the right phase. **Lite never silently swallows a big change.**

## Doc footprint & growth
Lite writes `source/`, `01-working-spec.md`, `index.md`, and a `CHANGELOG.md` entry — **no A–F files** unless escalated. If a lite-built feature later grows and needs a full run, that run back-fills A/B from the existing code+tests first (same as adopting an un-tracked feature), then proceeds.
