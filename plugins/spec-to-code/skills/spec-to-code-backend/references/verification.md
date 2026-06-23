# Verification — backend test stack

Three layers, matched to backend risk. No Playwright/screenshots — the appearance/interaction layers are replaced by **integration** and **API-contract** testing.

| Layer | Proves | Tool | When |
|-------|--------|------|------|
| Logic (unit) | rules, calculations, state machines, validation, pure transforms | Vitest/Jest/pytest/go test | **before** impl (RED→GREEN) |
| Integration | code + real **test DB** (+ external stubs): queries, transactions, migrations applied | same runner + a disposable DB (testcontainers / sqlite / docker) | before/with impl |
| API contract | request → **status code · response shape · error code** per the resolved spec; auth required; pagination | supertest/httptest/requests against the running app | with impl |

## Detecting tools (Phase 1)
- **Test runner**: from `package.json`/config or language equivalent. Use the project's existing one.
- **DB & migrations**: ORM/driver + migration tool (Prisma/Knex/Alembic/golang-migrate…). A test DB is needed for the integration layer — testcontainers, a docker service, or sqlite/in-memory. If none exists, offer to add one (don't install silently); else fall back to mocking the data layer and **flag** the reduced confidence.
- **Pure library / no DB or HTTP**: integration & contract layers fold into the unit suite.

## Layer 1 — Logic (unit, TDD)
Pure domain logic with no DB/HTTP imports → fast unit tests, RED→GREEN. This is what keeps the logic separable from framework/IO. Write one test **per grid cell** (each equivalence class / boundary / branch-complement from `00-behavior-grid.md`), not one per bundled case; confirm RED for the right reason (a test green against unimplemented code is trivial).

## Layer 2 — Integration (test DB)
- Run against a disposable DB with **migrations applied** (the same migrations shipped).
- Assert persistence: rows written/read, constraints (unique, FK, checks) enforced, **transactions roll back on failure**, no partial writes.
- Reset/seed state per test for determinism.

## Layer 3 — API contract
- Hit the actual endpoints; assert **HTTP status, response body shape, and machine error codes** match the resolved spec's error model.
- Cover: success, validation failure (4xx + which code), **auth required (401/403)**, not-found, conflict (e.g. duplicate/idempotency), rate-limit if specified, pagination/filter params.
- Stub external services at the boundary for determinism; test their failure paths (timeout/5xx → defined behavior).

## Backend-specific must-verify
- **Idempotency** — same request twice (same key) → one effect, not two.
- **Transactions** — a mid-operation failure leaves no partial state.
- **Concurrency** — two racing writers → no lost update / correct locking (test with parallel calls where feasible).
- **AuthZ** — a user without permission is rejected (not just unauthenticated).
- **Migrations** — apply cleanly forward; reversible/additive where claimed; no data loss on existing rows.

## Comprehensive verify (Phase 11)
Run everything, then audit: **bidirectional cell coverage** — *forward:* every resolved-spec behavior → ≥1 grid cell (the grid is a complete decomposition of the whole spec, not just its gaps — a well-defined requirement that never became a cell is an untested behavior); *back:* every `00-behavior-grid.md` cell → case → test (count cells/covered/uncovered — catches a class lost between grid and tests) — conformance (every cell exercised **and actually asserted**), traceability filled, **logic/IO separation** (domain free of framework/DB imports). The `spec-verifier` agent adversarially checks each "covered" claim against the actual test — a contract test that doesn't assert the error code, an integration test hitting mocks instead of a DB, or a test asserting a sibling class, is hollow. Report gaps honestly.
