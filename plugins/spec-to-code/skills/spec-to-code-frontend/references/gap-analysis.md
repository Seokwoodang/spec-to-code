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

## ⭐ Branch / complement completeness — the most-missed gap

A spec almost always states the **positive** case ("when X, the button goes to **A**") and leaves the **complement** unstated. AI then codes only the named branch and silently drops "when **NOT X** → where?". Catch this *systematically*, never by luck:

- **For every conditional the spec states** ("when X → A", "if logged in → …", "on success → …", "for admins → …"), generate a **mandatory question for its complement**: not-X / failure / the other roles / the other states → **what exactly?**
- **Enumerate every branch of every decision**, not just the one named. A condition with N outcomes needs N answers; a boolean needs **both**; a switch needs the **default**.
- The **else / default is never assumed** — it is a decision the user makes (go to B? stay? error? no-op?).
- **Test rule:** each branch **including the complement** is its own test case. A "when X → A" test with no "when not-X → ?" test is a **visible hole** in the traceability matrix — surface it, don't pass it.

This is the concrete net for "AI implemented the `if` but not the `else`."

## Enumerate, don't eyeball — the MANDATORY filled-grid artifact

> **The grid is the FULL behavior decomposition of the whole spec — not a list of holes.** The filename says "gap-analysis" because the *process* hunts gaps, but the *artifact* enumerates **every** behavior of the feature, the clearly-specified happy paths included (e.g. `create·valid`, `search·title-match` are cells too). A "gap" is just a cell that started empty; resolving it fills the grid. So the **test basis is the entire resolved spec**, decomposed into cells — never only the ambiguous parts. Coverage is therefore **bidirectional**: every resolved-spec behavior maps to ≥1 cell (nothing in the spec is dropped before the grid), and every cell maps to ≥1 test (nothing in the grid is left untested). The first direction is what stops a well-defined requirement from never becoming a cell — and thus never a test.

This is **not optional and not gated on spec size.** Every run produces `00-behavior-grid.md` (the full behavior grid) before the resolved spec. "The spec looks well-defined" is **not** grounds to skip it — re-architecture (sync→async, in-memory→server, single-page→routed) introduces branches the source never had, and those are exactly what eyeballing misses. Prose "be exhaustive" has failed before; the forcing function is the **filled table**, where "did we think of every case?" becomes "is any cell empty?".

1. **List the axes** (the variables): inputs, UI/resource states, roles/permissions, feature flags, external-call outcomes (ok/empty/error/timeout), navigation/persistence (refresh, deep-link, back). *This step is judgment — list every axis you can think of; a missed **axis** (not a missed combination) is the residual risk enumeration can't close, so it is handed to the critic (below).*
2. **Take the cartesian product** — every combination is a row/cell.
3. **Every cell must have a decided behavior. An empty cell = unresolved gap → a Gate-1 question.** No cell is assumed.
4. Two shapes (use both where they apply):
   - **Decision table** — conditions (columns) × rules (rows) → action. Catches missing rule combinations.
   - **State × event matrix** — states (rows) × events (columns) → next state / effect. Catches missing transitions, **including the else/complement** ("when NOT X").
5. **Unbounded inputs** → enumerate **equivalence classes + boundaries** as the axis values (empty, min, max, over-max, malformed, unicode/emoji, very long).

The grid kills "combination missed" (incl. the if-without-else class) deterministically. What it cannot kill is an axis nobody listed — that's the critic's job (below), not the grid's.

## Fan-out is the default mechanism — by a countable trigger, not a judgment call

Do not decide "is this a large spec?" by feel (that judgment is how the grid gets skipped). Apply the **mechanical trigger**:

> **If the spec has ≥2 screens/sections, OR ≥3 distinct stateful behaviors/conditionals → fan-out is REQUIRED**: spawn one `gap-hunter` per section (in parallel), each returning a structured gap list + its slice of the filled grid; then merge and dedupe in the main conversation. Below the threshold, inline is allowed — **but the filled grid of §"Enumerate" is still mandatory regardless of size.**

So: **enumeration is unconditional; fan-out is the mechanism above the threshold.** Resolution (asking the user) always stays in the main conversation — subagents cannot ask the user.

## Adversarial completeness critic — REQUIRED before Gate 1

The grid guarantees coverage *within listed axes*; it cannot prove no axis was forgotten. Close that with one mandatory adversarial pass: after the grid is filled, spawn a critic (a fresh `gap-hunter`/`Explore` whose **only** job is to refute completeness) prompted to find: **(a) an empty/▢ cell, (b) an axis nobody listed, (c) a stated conditional with no complement row, (d) a requirement that resists becoming a test.** Its findings are folded back into `00-behavior-grid.md` before the resolved spec is written. This is the LLM-level check the hook cannot do (a hook sees only *presence*, never *completeness*).

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

## Exit condition (hard checklist — all must hold before Gate 1)

Phase 2/3 is done only when **every** box is true:
- [ ] `00-behavior-grid.md` exists in `v<N>/` with the **axes list** + decision table(s)/state×event matrix(es), **zero empty cells** (each is a decision or a flagged GAP).
- [ ] **Forward coverage:** every behavior stated in the spec maps to ≥1 grid cell — the grid is a *complete decomposition of the whole spec*, not just its ambiguous parts (well-defined happy paths are cells too). Walk the spec once and confirm nothing well-specified was left out of the grid.
- [ ] Fan-out trigger evaluated and obeyed (fan-out run if ≥2 sections or ≥3 conditionals; noted either way).
- [ ] Adversarial completeness critic run; its findings resolved or parked.
- [ ] Every stated conditional has its complement ("not-X") row.
- [ ] Zero BLOCKER/BEHAVIORAL gaps open; every TRIVIAL assumed-default listed for veto.
- [ ] Every resolved item is expressible as a test case (given/when/then). Anything that resists → back to the user.

**Structurally enforced:** the gate-guard hook blocks writing `02-resolved-spec.md` until `00-behavior-grid.md` exists in the same `v<N>/` — you cannot reach the contract without first producing the grid. (The hook checks *presence*; this checklist + the critic cover *completeness*.)
