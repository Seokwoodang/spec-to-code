# spec-to-code

A Claude Code plugin: a **gated, test-driven flow that turns an incomplete spec into complete, verified code.**

The value is the work *between* spec and code — finding what the spec leaves unsaid, resolving it with you, and proving the result. Code is never written from an unresolved spec.

## What it does

```
any-format spec → [normalize] → [find gaps] → [resolve with user] → resolved spec → TDD code → review loop → proof docs
```

- **Any spec format** — markdown, HTML/mockup, PDF, image/Figma export, `.docx`, URL, or pasted text are normalized into a working spec (visual cues preserved for the UI layer).
- **Fresh & update modes** — runs greenfield, and re-runs on later spec revisions as a *delta*: diff the spec, impact-analyze via the traceability matrix, apply only the change, and run the full prior suite as a regression guard so a revision never silently breaks an existing case.
- **Three human checkpoints** — approve the *resolved spec + test plan* before any code (Gate 1); drive an iterative *code-review loop* (review → comment → fix → re-review until pass); approve the *completion package* after (Gate 2).
- **3-layer verification** — logic (unit-test TDD, red→green), UI behavior (Playwright E2E), UI appearance (Playwright screenshot baselines you bless once, then guarded automatically).
- **5 artifacts** as your verification surface — Resolved Spec, Test Doc, Traceability Matrix, Review Doc, Completion Doc — so you confirm the work from docs, not raw code.
- **Bundled agents** — `gap-hunter` (parallel gap analysis), `code-reviewer` (review loop), `spec-verifier` (adversarial verification).
- **Project-agnostic** — detects the test runner, whether a UI exists, and Playwright; adapts accordingly.

## Install

```
/plugin marketplace add <your-github-owner>/spec-to-code
/plugin install spec-to-code@spec-to-code
```

Then run `/spec-to-code` (or hand Claude a spec and ask it to implement it properly).

## Layout

```
.claude-plugin/marketplace.json      marketplace manifest
plugins/spec-to-code/
├── .claude-plugin/plugin.json       plugin manifest
├── commands/spec-to-code.md         /spec-to-code entry point
├── agents/
│   ├── gap-hunter.md                parallel gap analysis (read-only)
│   ├── code-reviewer.md             review-loop reviewer (read-only)
│   └── spec-verifier.md             adversarial verification (read-only)
└── skills/spec-to-code/
    ├── SKILL.md                     the flow (spine)
    ├── references/                  ingestion · gap taxonomy · verification stack · doc templates
    └── scripts/verify-workflow.js   Phase-11 comprehensive-verification workflow
```
