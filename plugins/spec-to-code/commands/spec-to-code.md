---
description: Turn an incomplete spec into complete, verified code via a gated TDD flow (find gaps → resolve with user → TDD → proof docs).
argument-hint: "[path to spec file, or paste the spec]"
---

Run the **spec-to-code** flow on the spec below (or at the path) — see the `spec-to-code` skill for the full procedure.

Spec / target: $ARGUMENTS

Follow the flow exactly:

1. **Ingest & probe** — normalize the spec from whatever format it came in (md/HTML/PDF/image/Figma/docx/URL/pasted text) into a working spec, keeping visual notes for UI; then detect test runner, UI presence, Playwright, doc home; read and obey the repo's `CLAUDE.md`.
2. **Gap analysis** — find everything the spec leaves undecided. For a large/multi-section spec, fan out the read with the `gap-hunter` agent (one per section, distinct lenses).
3. **Gap resolution** — batch the gaps into decision questions, put them to the user, and write the **Resolved Spec (A)** + **Test Plan (D)**. Loop until zero open gaps and every requirement is test-shaped.
4. **🚪 Gate 1 — HARD STOP.** Present A + D; do not write code until the user approves.
5. **Design** the logic/UI split; draft the **Traceability Matrix (B)**.
6. **Write tests first (RED)** — logic unit tests + UI-behavior tests. A test that can't be written concretely is a gap → return to step 3.
7–8. **Implement to GREEN** — logic first, then thin UI over the tested logic.
9. **Visual verify** — Playwright screenshots per state (baseline candidates).
10. **🔁 Review loop** — run the `code-reviewer` agent over the diff → **Review Doc (E)**; present to the user, take accept/reject/defer per finding, apply fixes, re-review. Loop until no open blocker/major findings AND the user signs off. Do not proceed until it passes.
11. **Comprehensive verify** — full suite + conformance/coverage/separation audit; fill **B**. Use `scripts/verify-workflow.js` (with the `spec-verifier` agent) if multi-agent orchestration is opted into, else audit inline.
12. **🚪 Gate 2 — HARD STOP.** Report **C** + **D** report + filled **B** + **E** + screenshots; wait for approval. Never commit unless explicitly told.

Honor the two hard rules: gaps are resolved by the user (not invented), and any requirement that cannot become a test is still a gap.
