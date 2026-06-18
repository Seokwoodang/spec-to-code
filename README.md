# spec-to-code

A Claude Code plugin: a **gated, test-driven flow that turns an incomplete spec into complete, verified code.**

The value is the work *between* spec and code — finding what the spec leaves unsaid, resolving it with you, and proving the result. Code is never written from an unresolved spec.

## What it does

```
incomplete spec → [find gaps] → [resolve with user] → resolved spec → TDD code → proof docs
```

- **Two human gates** — you approve the *resolved spec + test plan* before any code (Gate 1), and the *completion doc + test report + screenshots* after (Gate 2).
- **3-layer verification** — logic (unit-test TDD, red→green), UI behavior (Playwright E2E), UI appearance (Playwright screenshot baselines you bless once, then guarded automatically).
- **4 artifacts** as your verification surface — Resolved Spec, Test Doc, Traceability Matrix, Completion Doc — so you confirm the work from docs, not raw code.
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
└── skills/spec-to-code/
    ├── SKILL.md                     the flow (spine)
    ├── references/                  gap taxonomy · verification stack · doc templates
    └── scripts/verify-workflow.js   Phase-10 comprehensive-verification workflow
```
