# Verification — the 3-layer test stack

The flow proves correctness in three layers, each matched to what it can actually verify. Logic and UI-behavior are caught by tests (written first, TDD); UI-appearance is caught by screenshots blessed once by the user, then guarded automatically.

| Layer | What it proves | Tool | When written |
|-------|----------------|------|--------------|
| Logic | rules, calculations, state machines, error handling | unit tests (Vitest/Jest/pytest/…) | **before** impl (RED→GREEN) |
| UI behavior | state→view mapping, interactions, conditional render, error display | Playwright E2E (real browser) — or Testing Library if no Playwright | before/with UI impl |
| UI appearance | pixels, layout, alignment, style | Playwright `toHaveScreenshot()` | after impl; baseline blessed at Gate 2 |

## Detecting tools (Phase 1)
- **Test runner**: read `package.json` scripts/deps, config files (`vitest.config`, `jest.config`), or language equivalent (`pytest`, `go test`). Use the project's existing runner; do not introduce a new one without asking.
- **Playwright**: check deps and `playwright.config.*`. If a UI exists and Playwright is absent, offer to add it (`npm i -D @playwright/test && npx playwright install`) — install only with user consent. If the user declines, fall back to Testing Library for UI behavior and to manual run + screenshot for appearance, and say so.
- **No UI** (CLI/library): skip the UI-behavior and appearance layers entirely; logic TDD carries the whole verification.

## Layer 1 — Logic TDD
1. From the Test Plan, write one test **per grid cell** (each equivalence class / boundary / branch-complement from `00-gap-analysis.md`), not one per bundled case — before implementing.
2. Run → confirm RED for the right reason (function missing / not-implemented), not a typo. A test that goes GREEN against unimplemented code is trivial — fix it.
3. Implement the smallest logic to go GREEN. Refactor with tests green.
4. Keep logic pure and import-light so it tests without DOM/network — this enforces the logic/UI split.

## Layer 2 — UI behavior (Playwright E2E)
- Drive the real browser: render each state, perform interactions, assert the resulting DOM/text/visibility.
- Cover the state and transition cases from the resolved spec: empty, loading, error, success, disabled, etc.
- Prefer role/label/text selectors over brittle CSS. Stub network at the boundary for deterministic states.
- Real-browser E2E beats jsdom here because it exercises actual events, focus, and layout-dependent behavior.

## Layer 3 — UI appearance (screenshot baseline)
- **First run has no baseline** — `toHaveScreenshot()` can prove "same as before", not "looks correct". So:
  1. Playwright captures a screenshot per relevant state (Phase 9).
  2. The user eyeballs them at Gate 2 and **blesses the baseline** (approves the committed snapshot).
  3. From then on, Playwright fails the build on any visual drift from the blessed baseline.
- Capture meaningful states, not just the happy path: empty, error, long-content, loading if visually distinct.
- Pin sources of flakiness (fonts, animations, dates, random) so the baseline is stable — disable animations, freeze time, seed data.

## Comprehensive verify (Phase 10)
Run everything, then audit four dimensions — inline, or as a Workflow fan-out (`scripts/verify-workflow.js`) if multi-agent orchestration is opted into:
1. **Cell coverage** — **every grid cell** from `00-gap-analysis.md` maps to ≥1 test (count cells, count covered, list any uncovered → must be empty or deferred). This is the dimension that catches a class that vanished between grid and tests.
2. **Conformance** — every cell is demonstrably exercised by a test or screenshot **and actually asserted** (the test would fail if the behavior regressed).
3. **Coverage / traceability** — the matrix has no `TODO`/empty rows; each cell → case → test → code → pass.
4. **Separation** — logic has no UI imports; UI is thin over tested logic. Flag leaks.

Adversarially verify findings (the `spec-verifier` agent): for each "covered" claim, a skeptic opens the test and checks it asserts *that specific cell* (not a sibling class, not a hollow always-green test). Report empty matrix cells honestly — they are unfinished work, not noise to hide.
