# Gap Analysis — taxonomy & questioning

The goal of Phase 2 is to find every place the spec is silent, vague, or contradictory *before* a line of code is written. Be exhaustive and slightly adversarial: assume the spec author left holes, and hunt them.

## Gap taxonomy

Walk the spec against each category. A category with no gap is fine — record it as "covered" so the user sees it was checked.

### 1. States
- What discrete states can the feature/screen be in? (empty, loading, partial, loaded, error, offline, unauthorized, disabled, read-only…)
- Is each state's appearance and behavior defined? Initial/default state on first entry?

### 2. Transitions
- For every state, what events move it to which next state? Missing edges are gaps.
- What happens on rapid/repeated triggers, double-submit, back-navigation mid-flow, refresh mid-flow?

### 3. Input & data
- Valid ranges, formats, lengths, required vs optional. What is rejected and how?
- Boundary values (0, negative, max, empty string, whitespace, very long, unicode/emoji).
- Null/undefined/missing fields from upstream. Stale data.

### 4. Error & failure modes
- Each external call: what on failure, timeout, partial success, retry? User-visible message? Recoverable?
- Validation failures: inline vs blocking? When does validation fire (on change / blur / submit)?
- Permission/auth failure mid-action.

### 5. Empty / loading / boundary UI
- First-load skeleton vs spinner vs nothing. Empty-list copy and CTA. Loading-while-data-exists (refetch).
- Pagination/infinite scroll end. Zero / one / many. Overflow & truncation.

### 6. Concurrency & timing
- Two actions at once. Optimistic vs pessimistic update. Race between user action and incoming update.
- Debounce/throttle expectations. Stale response arriving after newer one.

### 7. Cross-cutting
- Permissions/roles: who can see/do what. i18n: which strings, plural/RTL. a11y: focus, labels, keyboard.
- Responsive/breakpoints if UI. Persistence: what survives reload/session.

### 8. Non-functional
- Performance limits (list size, response budget). Analytics/events to fire. Logging. Feature flags / rollout.

### 9. Contradictions & ambiguity
- Two parts of the spec that conflict. Terms used loosely ("fast", "recent", "some"). Pronouns/references with unclear antecedent.
- Implicit assumptions ("the user is logged in") never stated.

## Severity tagging

Tag each gap so questioning can prioritize and so trivial items don't drown the user:

- **BLOCKER** — code cannot be correct without an answer (e.g. undefined error behavior on a core path). Always ask.
- **BEHAVIORAL** — changes observable behavior; default would be a guess. Ask.
- **TRIVIAL** — conventional, reversible, low-stakes (e.g. obvious spacing). May assume with a stated default; list these for the user to veto, don't make them decide each.

## Turning gaps into questions

- **Batch**: group related gaps into a handful of decision questions. Never drip one at a time.
- **Offer concrete options** with `AskUserQuestion` when the answer space is small and discrete; recommend one (mark it). Use prose for open-ended design questions.
- **Carry a default**: phrase as "I'll do X unless you say otherwise" for BEHAVIORAL gaps where a sensible lead exists — faster for the user, still their call.
- **Make each answer test-shaped**: a good answer can be restated as "given … when … then …". If it can't, the gap isn't fully closed.

## Exit condition

Phase 2/3 is done only when: zero BLOCKER/BEHAVIORAL gaps remain open, every assumed TRIVIAL default is listed for veto, and every resolved item is expressible as a test case in the Test Plan (the test doc). Anything that resists becoming a test goes back to the user.

## Large specs

For multi-screen / multi-section specs, fan out the *reading* with the Workflow tool — one agent per section returning a structured gap list — then merge and dedupe. Resolution (asking the user) stays in the main conversation; subagents cannot ask the user.

---

## Backend-specific gap categories (walk these in addition)

- **Authn / authz** — who may call this endpoint? required scopes/roles? resource ownership checks (can user A act on user B's data)?
- **Input validation** — server-side validation rules (don't trust client); types, ranges, formats, max sizes; rejection shape.
- **Idempotency** — safe to retry? duplicate submits (double-click, client retry) → one effect? idempotency key needed?
- **Transactions & consistency** — which writes must be atomic? partial-failure behavior? read-after-write expectations.
- **Concurrency / locking** — racing requests on the same row → lost update? optimistic (version) vs pessimistic lock? unique-constraint races.
- **Error model** — HTTP status per case + a stable machine-readable error code; what's exposed vs hidden (no internal leak/stack traces).
- **Rate limits / quotas** — per user/IP/key? response on limit (429)?
- **Pagination / filtering / sorting** — contract: page params, limits, default order, total count, stable ordering.
- **Data lifecycle** — soft vs hard delete; retention; cascading deletes; audit/event logging.
- **External calls** — timeout, retry/backoff, circuit-break; failure → defined user-facing behavior; partial success.
- **Migrations** — additive/reversible? backfill needed? effect on existing rows? zero-downtime?
- **Observability** — what to log/trace/meter (without logging secrets/PII).

Each still becomes a test (unit / integration / contract). If it can't, it's an unresolved gap → back to the user.
