# Verification — the 4-layer test stack (a testing pyramid)

The flow proves correctness in four layers, each matched to what it can actually verify — and sized like a **pyramid**: many fast logic + component-render unit tests at the base, fewer end-to-end flows above, a thin appearance cap on top. Logic, component-render, and UI-flow are caught by tests (written first, TDD); UI-appearance is caught by screenshots blessed once by the user, then guarded automatically.

| Layer | What it proves | Tool | When written |
|-------|----------------|------|--------------|
| 1 · Logic | rules, calculations, state machines, error handling (pure, no DOM) | unit tests (Vitest/Jest/…) | **before** impl (RED→GREEN) |
| 2 · Component render | a **single component in isolation**: props → rendered output, conditional-render branches, local state, event-handler wiring, roles/labels/a11y | component unit tests (Testing Library / Vue Test Utils / etc. + jsdom) | **before**/with that component |
| 3 · UI flow (behavior) | **cross-component** journeys: navigation/routing, multi-step interactions, focus management, real events & network, layout-dependent behavior | Playwright E2E (real browser) | with UI impl |
| 4 · UI appearance | pixels, layout, alignment, style | Playwright `toHaveScreenshot()` | after impl; baseline blessed at Gate 2 |

**Which layer for a render?** If it's "given these props/state, does *this one component* render the right thing?" → **Layer 2** (fast, isolated, the bulk of UI tests). If it's "does the *flow across components/pages* behave?" (search → results → click → detail, focus moving, real fetch) → **Layer 3**. Don't push a single-component render assertion up into E2E — that's slow and brittle for what a component unit test does better.

## Detecting tools (Phase 1)
- **Test runner**: read `package.json` scripts/deps, config files (`vitest.config`, `jest.config`), or language equivalent (`pytest`, `go test`). Use the project's existing runner; do not introduce a new one without asking.
- **Component test lib (Layer 2)**: detect the framework's render-testing lib (React/Vue/Svelte Testing Library, etc.) + a jsdom/happy-dom env. Usually already present with the runner; if a UI exists and none is configured, offer to add it (install only with consent). This is a **first-class layer, not a fallback**.
- **Playwright (Layer 3)**: check deps and `playwright.config.*`. If a UI exists and Playwright is absent, offer to add it (`npm i -D @playwright/test && npx playwright install`) — install only with user consent. If the user declines, push as much UI-behavior as possible down into Layer 2 component tests, do flow checks via manual run, and say so.
- **No UI** (CLI/library): skip Layers 2–4 entirely; logic TDD carries the whole verification.

## Layer 1 — Logic TDD
1. From the Test Plan, write one test **per grid cell** (each equivalence class / boundary / branch-complement from `00-behavior-grid.md`), not one per bundled case — before implementing.
2. Run → confirm RED for the right reason (function missing / not-implemented), not a typo. A test that goes GREEN against unimplemented code is trivial — fix it.
3. Implement the smallest logic to go GREEN. Refactor with tests green.
4. Keep logic pure and import-light so it tests without DOM/network — this enforces the logic/UI split.

## Layer 2 — Component render (unit, Testing Library + jsdom)
- **Mount one component in isolation** and assert on its output — the bulk of UI tests, fast enough to run in the unit suite, written RED→GREEN like logic.
- Cover **per grid cell**: props → rendered output, each **conditional-render branch** (and its complement), local state changes, **event-handler wiring** (click/change calls the right handler with the right args), and roles/labels/disabled/aria.
- Stub props/callbacks; no real network or routing. Prefer role/label/text selectors over brittle CSS.
- This is where "does *this component* render the right thing for this state?" lives — e.g. `<ResultList items={[]}/>` shows the empty copy, `<HeartButton saved/>` renders pressed. Don't promote these to E2E.

## Layer 3 — UI flow / behavior (Playwright E2E, real browser)
- Drive the real browser for **cross-component journeys**: navigation/routing, multi-step interactions, focus management, real events, and layout-dependent behavior jsdom can't exercise.
- Cover the state/transition cases that span components: search → results → click → detail, error→retry→success, etc. Stub network at the boundary for deterministic states.
- Reserve E2E for what Layer 2 can't do — keep the pyramid: few flows here, many component tests below.

## Layer 4 — UI appearance (screenshot baseline)
- **First run has no baseline** — `toHaveScreenshot()` can prove "same as before", not "looks correct". So:
  1. Playwright captures a screenshot per relevant state (Phase 9).
  2. The user eyeballs them at Gate 2 and **blesses the baseline** (approves the committed snapshot).
  3. From then on, Playwright fails the build on any visual drift from the blessed baseline.
- Capture meaningful states, not just the happy path: empty, error, long-content, loading if visually distinct.
- Pin sources of flakiness (fonts, animations, dates, random) so the baseline is stable — disable animations, freeze time, seed data.

## Comprehensive verify (Phase 10)
Run everything, then audit four dimensions — inline, or as a Workflow fan-out (`scripts/verify-workflow.js`) if multi-agent orchestration is opted into:
1. **Cell coverage (bidirectional)** — **forward:** every behavior in the resolved spec maps to ≥1 grid cell (the grid is a complete decomposition of the whole spec, not just its gaps — a well-defined requirement that never became a cell is an untested behavior); **back:** **every grid cell** from `00-behavior-grid.md` maps to ≥1 test (count cells, count covered, list any uncovered → must be empty or deferred). Forward catches a spec behavior that never entered the grid; back catches a class that vanished between grid and tests.
2. **Conformance** — every cell is demonstrably exercised by a test or screenshot **and actually asserted** (the test would fail if the behavior regressed).
3. **Coverage / traceability** — the matrix has no `TODO`/empty rows; each cell → case → test → code → pass.
4. **Separation** — logic has no UI imports; UI is thin over tested logic. Flag leaks.
5. **Code coverage** — measure line/branch/function with the runner (see below). Complements cell coverage: cell coverage proves *spec → test*; code coverage catches *code paths no test touches* (a branch the grid never foresaw). Every uncovered branch is classified, not just counted.

Adversarially verify findings (the `spec-verifier` agent): for each "covered" claim, a skeptic opens the test and checks it asserts *that specific cell* (not a sibling class, not a hollow always-green test). Report empty matrix cells honestly — they are unfinished work, not noise to hide.

## Code coverage (Phase 11) — diagnostic-first, hard bar on pure logic
Two coverages are complementary: **cell coverage** (primary, behavioral — spec→test) and **code coverage** (this, secondary net — finds code the tests never execute). Code coverage is a *diagnostic to find untested branches*, **not a percentage to chase** — a global %-gate breeds hollow tests, which is exactly what this flow forbids.

- **Tool:** the project runner's coverage — Vitest `--coverage` (v8/istanbul) or Jest `--coverage`. Instrument **Layers 1+2** (logic + component unit, jsdom) — cheap and reliable. **Layer 3 (Playwright E2E) is best-effort** (instrumentation is heavy); flow assurance comes from cell coverage, not E2E line counts.
- **Key metric = branch coverage.** It ties directly to gap-analysis **branch-complement**: an uncovered branch is often a missing not-X. Report line/branch/function/statement.
- **Hard bar — pure logic only:** Layer-1 logic modules must hit **≥90% branch** (they are fully testable; below that = real gaps). **Components (Layer 2): report, no blanket %-fail** — some branches are visual and covered by E2E/screenshot, so a number alone misleads.
- **The teeth = classify every uncovered line/branch** (no silent uncovered code, mirroring "no empty cell"): (a) **missing cell** → add the test (and the grid row); (b) **covered only by E2E/appearance** → note which layer; (c) **dead code** → remove it; (d) **justified ignore** → inline `/* c8 ignore next -- <reason> */`. An unclassified uncovered branch fails the audit.
- **Exclude** config, generated code, type-only files, stories, and the test files themselves.
- **Record** the numbers + the uncovered-classification in `04-test-doc.md` Report and `07-verify.md`.
