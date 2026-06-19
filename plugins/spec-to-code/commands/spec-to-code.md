---
description: Turn an incomplete spec into complete, verified code via a gated TDD flow (find gaps → resolve with user → TDD → proof docs).
argument-hint: "[path to spec file, or paste the spec]"
---

Run the **spec-to-code** flow on the spec below (or at the path) — see the `spec-to-code` skill for the full procedure.

Spec / target: $ARGUMENTS

**Pick the tier first** (Phase 1 quick scan): for a small, low-risk change ("add one button", "tweak this") run the **lite** path (`references/lite-mode.md`) — 4 steps, 1 gate, a single CHANGELOG entry; for large/uncertain work run the **full** 12-phase flow below. Honor an explicit "lite" request unless the scan finds a blocker → escalate to full.

**Checkpoint mode** (full tier): default **checkpoint** = 4 hard stops (Gate 1 spec+plan · design+RED tests · code+review loop · final). If the user asks "꼼꼼히/step-through", also stop at design/logic/UI/visual individually. NEVER run the review loop solo — the user dispositions every finding. The safety core (user-resolved gaps, test-first, regression, no unprompted commit) holds throughout.

Follow the flow exactly:

1. **Ingest & probe** — normalize the spec from whatever format it came in (md/HTML/PDF/image/Figma/docx/URL/pasted text) into a working spec, keeping visual notes for UI; then detect test runner, UI presence, Playwright, doc home; read and obey the repo's `CLAUDE.md`. **Detect mode:** if prior artifacts exist in the doc home, this is an **UPDATE** — follow the delta path in `references/spec-update.md` (spec diff → impact analysis via Matrix B → delta gaps + Gate 1 → delta TDD → **regression** → review → verify → Gate 2). Otherwise continue fresh below.
2. **Gap analysis** — find everything the spec leaves undecided. For a large/multi-section spec, fan out the read with the `gap-hunter` agent (one per section, distinct lenses).
3. **Gap resolution** — batch the gaps into decision questions, put them to the user, and write the **Resolved Spec (A)** + **Test Plan (D)**. Loop until zero open gaps and every requirement is test-shaped.
4. **🚪 Gate 1 — HARD STOP.** Present A + D; do not write code until the user approves.
5. **Design** the logic/UI split; draft the **Traceability Matrix (B)**.
6. **Write tests first (RED)** — logic unit tests + UI-behavior tests. A test that can't be written concretely is a gap → return to step 3.
7–8. **Implement to GREEN** — logic first, then thin UI over the tested logic.
9. **Visual verify** — Playwright screenshots per state (baseline candidates).
10. **🔁 Review loop** — run the `code-reviewer` agent over the diff → **Review Doc (E)**; present to the user, take accept/reject/defer per finding, apply fixes, re-review. Loop until no open blocker/major findings AND the user signs off. Do not proceed until it passes.
11. **Comprehensive verify** — full suite + conformance/coverage/separation audit; fill **B**. Use `scripts/verify-workflow.js` (with the `spec-verifier` agent) if multi-agent orchestration is opted into, else audit inline.
12. **🚪 Gate 2 — HARD STOP.** Report **C** + **D** report + filled **B** + **E** + **F** + screenshots; wait for approval. Never commit unless explicitly told.

Honor the hard rules: gaps are resolved by the user (not invented); any requirement that cannot become a test is still a gap; and **no silent drop** — anything blocked, deferred, or out-of-scope goes to **Artifact F (Deferred & Blocked)** with a concrete revisit trigger the moment it arises, never just dropped.
