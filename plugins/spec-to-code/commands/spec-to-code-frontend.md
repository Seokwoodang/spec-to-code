---
description: Build a frontend/UI feature from an incomplete spec via the gated TDD flow (gaps → resolve → design → tests → code → review → docs).
argument-hint: "[spec file/path/paste — md, HTML, image, Figma, URL…]"
---
Run the **spec-to-code-frontend** skill on the spec below. Follow its SKILL.md exactly: ingest → gap analysis → 🚪 Gate 1 (resolved-spec) → design → 🚪 tests gate (RED) → implement → 🔁 independent review loop → verify → 🚪 Gate 2. Gates are document-driven (hand over the MD path, user approves the file). Verification = logic unit tests + Playwright UI-behavior/screenshot. Never write code before the design is approved (hook-enforced).

Spec / target: $ARGUMENTS
