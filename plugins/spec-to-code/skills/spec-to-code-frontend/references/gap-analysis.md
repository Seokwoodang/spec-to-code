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

## Enumerate, don't eyeball — decision tables & state×event matrices

For any behavior driven by conditions, do **not** rely on prose "be exhaustive". Build the explicit grid and force every cell — this turns "did we think of every case?" into a filled table (combinatorial completeness over the identified axes).

1. **List the axes** (the variables): inputs, UI/resource states, roles/permissions, feature flags, external-call outcomes (ok/empty/error/timeout). *This step is judgment — list every axis you can think of; a missed **axis** (not a missed combination) is the residual risk that enumeration can't close.*
2. **Take the cartesian product** — every combination is a row/cell.
3. **Every cell must have a decided behavior. An empty cell = unresolved gap → a Gate-1 question.** No cell is assumed.
4. Two shapes:
   - **Decision table** — conditions (columns) × rules (rows) → action. Catches missing rule combinations.
   - **State × event matrix** — states (rows) × events (columns) → next state / effect. Catches missing transitions, **including the else/complement** ("when NOT X").
5. **Unbounded inputs** → enumerate **equivalence classes + boundaries** as the axis values (empty, min, max, over-max, malformed, unicode/emoji, very long).

The grid kills "combination missed" (incl. the if-without-else class) deterministically. What it cannot kill is an axis nobody listed — that's for the review/critic nets, not the grid.

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
