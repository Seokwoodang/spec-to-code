---
description: Build a backend/API/DB feature from an incomplete spec via the gated TDD flow (gaps → resolve → design → tests → code → review → docs).
argument-hint: "[spec file/path/paste]"
---
Run the **spec-to-code-backend** skill on the spec below. Same gated flow as frontend, but specialized: verification = logic unit tests + **integration/API-contract tests + DB/migration checks**; gap taxonomy adds **auth/authorization, idempotency, transactions/concurrency, rate limits, server-side validation, pagination contracts, migrations**; design = **endpoints + request/response schema + error codes + DB schema**. Gates document-driven; no code before approved design (hook-enforced).

Spec / target: $ARGUMENTS
