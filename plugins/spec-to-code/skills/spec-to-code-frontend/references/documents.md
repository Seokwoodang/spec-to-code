# Artifacts — templates & guidance

The documents are the user's verification surface — they let the user confirm the work without reading all the code. Each is handed over at the gate where it's approved: `02-resolved-spec.md` at Gate 1; `03-design.md` + `04-test-doc.md`(plan) at the Tests gate; `06-review/r<k>.md` during the review loop; `07-verify.md` + `08-completion.md` + filled `05-traceability.md` + `deferred.md` at Gate 2. **Filenames are descriptive — no cryptic A/B/C letters.**

## Storage, naming & format (authoritative)

- **Where** — all artifacts live in the feature's **doc home**: `docs/spec-to-code/<slug>/` by default. If the repo has its own docs convention (e.g. a top-level `doc/` tree), nest the home under it instead; decide once in Phase 1 and keep it stable.
- **Slug** — lowercase **kebab-case**, derived from the feature name, ≤ ~40 chars (e.g. `cart-bulk-delete`). This is the feature's identity for update detection; never rename it across updates.
- **Format** — every artifact is a single **Markdown** file (`.md`) following the templates below. Write prose in the user's working language, but keep table headers/keys as shown so the docs stay machine-parseable on later runs.
- **Screenshots** — Playwright baselines live where the test framework puts them (alongside the e2e tests, in its `*-snapshots/` dirs) and are committed to the repo; **C links to them**, images are not copied into the doc home.
- **Code & tests** — go in the **project's own conventional locations** (detected in Phase 1), never the doc home. The doc home holds documents only.

Files (doc home) — **versioned by spec version**:
```
docs/spec-to-code/<slug>/
├── index.md           COMMON: status + version list + link to latest
├── CHANGELOG.md       COMMON: run log across all versions
├── source/            COMMON: verbatim original archive (<date>-original.<ext>)
├── deferred.md      COMMON: parking lot (carries across versions, living)
├── v1/                fresh run's full artifact set
│   ├── 00-behavior-grid.md   filled grid (axes + decision/state×event tables) — Phase 2, MANDATORY, hook-gated before 02
│   ├── 01-working-spec.md   normalized snapshot — the diff baseline for the NEXT version
│   ├── 02-resolved-spec.md
│   ├── 03-design.md         the complete dev doc (Phase 5): files, functions, every behavior
│   ├── 05-traceability.md
│   ├── 04-test-doc.md     (Plan first; Report appended in P11)
│   ├── 06-review/r<k>.md       (ALL review rounds kept — never overwritten)
│   ├── 07-verify.md         comprehensive-verification report (Phase 11)
│   └── 08-completion.md
└── v2/                update run's full artifact set (delta applied)   ← created per update
    └── …
```
**Version = run.** Fresh → `v1`. Each update → next `v(N+1)/` (count existing `v*` dirs). The version folder holds the complete per-run doc set so every spec version's docs are preserved whole (browsable, comparable — not only in git). **Common** files live at the slug root and accumulate across versions: `index.md` (points to latest + lists versions), `CHANGELOG.md`, `source/`, `deferred.md`. An update diffs the new spec against the **latest** `vN/01-working-spec.md`.

## Gates are document-driven (read this)
**Every hard stop hands the user a Markdown file, not a chat summary.** At each gate: (1) produce/update the artifact MD(s) for that gate in the doc home; (2) tell the user the **exact path(s)**; (3) ask them to **read the file and approve, or edit it directly** (their edits ARE the approved version — read them back); (4) proceed only after approval. Chat Q&A is only for *gap resolution* (Phase 3 questions) — every *gate approval* is on a file the user can open, diff, and edit. Approved files persist in the doc home; **review rounds and any re-approved versions are all kept, never overwritten** (git history + per-round sections are the trail).
`01-working-spec.md` is written in Phase 1 (overwritten each update) — the machine-facing normalization, while 02-resolved-spec.md is the user-approved contract. `CHANGELOG.md` is the running record of *what each run set out to do and did* (one entry per fresh/update run); `index.md` is the one-screen pointer to everything.

---

## index — overview / manifest
Written first in Phase 1 and updated as artifacts land and on each update run. The one-screen entry point to a feature's run.

```markdown
# <feature> — spec-to-code
slug: <slug>
source: <original spec path(s)/link(s)>
status: <in progress @ Phase N | complete | blocked>

## Artifacts
- [working-spec](01-working-spec.md) · [resolved-spec](02-resolved-spec.md) · [traceability](05-traceability.md)
- [completion](08-completion.md) · [test-doc](04-test-doc.md) · [review](06-review/r<k>.md) · [deferred](deferred.md)

## Run history
- <date> — fresh: <one line>
- <date> — update: <what changed>
```

---

## CHANGELOG — per-run plan & record
The answer to "what has to be done for this update, and what was done." One entry per run (newest on top). In **update** mode it is written during U2–U5 and its **Tasks checklist is shown at the delta Gate 1** as the work plan to approve, then ticked off as the run proceeds and closed with the regression result. A **fresh** run seeds the first entry (the initial build). This is the audit trail of the feature's evolution; `index.md` links here.

```markdown
# Change Log — <feature>

## <date> · update — <status: planned | in progress | done>
### Spec diff (vs prior working-spec)
- modified: <C-id> — <what changed, old → new>
- added: <new requirement>
- removed: <requirement>
### Impact (reverse-lookup via the traceability matrix)
| change | spec-case | test(s) | code unit | screenshots |
|--------|--------|---------|-----------|-------------|
| modify discount cap | C8 | T7 | calcDiscount() | cart-applied |
### Tasks
- [ ] update test T7 to new expectation (RED)
- [ ] change cap logic in calcDiscount()
- [ ] regression: full prior suite
- [ ] update A/B/D, screenshots if visual changed
### Regression
- full suite: <N/M pass>; intentional changes: <T7>; unexpected breakage: <none | …>
### Deferred (→ F)
- <item> — revisit when <trigger>

## <date> · fresh — done
- initial build: <one line>; <N> cases, <M> tests.
```
The Tasks list is the literal "to-do for this update." Keep it honest — an unchecked box at Gate 2 means the update isn't complete (or the item moved to F with a reason).

---

## Gap Analysis (00-behavior-grid.md)
The **mandatory** Phase-2 grid, written **before** the resolved spec (the hook blocks `02` until this exists). Its job: turn "did we think of every case?" into "is any cell empty?". Not gated on spec size.

```markdown
# Gap Analysis — <feature>
slug: <slug>   phase: 2   fan-out: <ran N gap-hunters per section | inline (below threshold)>

## Axis checklist (every axis explicitly TICKED or marked N/A — forces recall of the one thing the grid can't: a forgotten axis)
- [ ] states (empty/loading/loaded/error/offline/unauthorized/disabled)
- [ ] inputs + boundaries (0/1/many, min/max/over-max, empty/whitespace/unicode/very-long)
- [ ] roles / permissions
- [ ] external-call outcomes (ok/empty/error/timeout/partial)
- [ ] navigation & persistence (refresh, deep-link, back mid-flow, what survives reload)
- [ ] concurrency / timing (double-submit, race, stale response, optimistic vs pessimistic)
- [ ] a11y (focus, keyboard, labels, dialog semantics)
- [ ] i18n (strings, plural, RTL)  ·  [ ] responsive / breakpoints
- [ ] performance limits  ·  [ ] feature flags / rollout  ·  [ ] security / authz
> Any box left unticked without an explicit N·A is itself a gap. The grid below enumerates combinations *within* these ticked axes.

## Decision table(s)
| <condition A> | <condition B> | … | → action / result |
|---|---|---|---|
| … | … | | <decided behavior, or **GAP→Q#**> |

## State × event matrix
| state \ event | <ev1> | <ev2> | … |
|---|---|---|---|
| <state1> | <next/effect> | <next/effect> | |
| <state2> | … | | |

## Branch-complement checklist (every "when X" → its "not-X")
- [x] when X → A · NOT-X → <decided / GAP→Q#>
- [ ] …

## Adversarial completeness critic
- ran: <yes>  ·  findings: <empty cells / missing axes / uncomplemented branches found> → folded in / parked (F#)

## Open gaps → Gate-1 questions
- Q1 (<axis/cell>, severity): <question>
```
**Exit:** zero empty cells (each is a decision or a flagged GAP), critic run, every branch complemented, every resolved item test-shaped. These open Q's flow into the resolved spec's Decisions table.

## Resolved Spec (02-resolved-spec.md)
The contract. Every gap from Phase 2, with the user's decision. This — not the original spec — is what the code implements.

```markdown
# Resolved Spec — <feature>
source spec: <path/link>   resolved: <date>

## Scope
<one paragraph: what is and isn't being built>

## Decisions (gap → resolution)
| # | Gap (category) | Question | Decision | Severity |
|---|----------------|----------|----------|----------|
| 1 | error mode | API 500 on submit? | inline retry banner, stay on form | BLOCKER |
| 2 | empty | list empty copy? | "No items yet" + Create CTA | BEHAVIORAL |

## Assumed defaults (trivial — user may veto)
- <thing>: assumed <X> because <convention>.

## Cases (the testable enumeration)
Each becomes ≥1 test in D. Format as given/when/then.
- C1: given <state>, when <event>, then <result>.
- C2: ...
```

---

## 03-design.md — the complete dev doc (Phase 5)
The exhaustive design the user approves **before any tests or code**. It must carry *everything needed to build*: a reader should be able to implement from this alone. Hand over the path; the user reads/edits/approves the file. *If a built HTML/mockup was the input, §2 also states how its markup/CSS decomposes into components (reuse, don't re-create) and where behavior/state/API attach.*

```markdown
# Design — <feature>
slug: <slug>   from: 02-resolved-spec.md   status: draft | approved <date>

## 1. Approach & architecture
- <overview in 2–4 sentences>
- Layer split: logic (<where>) vs UI (<where>) — what lives in each and why.

## 2. Files (every file to create/modify, with path)
| Path | New/Modify | Purpose |
|------|-----------|---------|
| src/lib/cart/coupon.ts | new | discount engine (pure) |
| src/components/CouponInput.tsx | new | UI: input + apply button |
| ... | | |

## 3. Data models / types
```
type Coupon = { id: string; type: 'fixed'|'percent'; value: number; ... }
type ApplyResult = { discount: number; final: number; ... }
```

## 4. Functions / API (each: signature, params, returns, behavior)
- `applyCoupons(cartTotal, coupons[], wallet?) -> ApplyResult`
  - params: ...   returns: ...   behavior: step by step ...
- `<component>` props/state/handlers ...

## 5. Behavior spec (every interaction & state — be exhaustive)
- **Apply button click**: validate input → call X → on success Y → on error Z (each branch).
- **States**: empty / loading / applied / error / disabled — what shows, what's enabled.
- **Transitions**: double-click, re-apply, remove, refresh — exact behavior.
- **Edge cases**: (enumerate, tie each to an spec-case)
- **Errors**: each failure path → user-visible result.

## 6. Dependencies / integration points
- backend endpoints, libs, existing modules reused.

## 7. Out of scope / open
- (should be none open after Gate 1; list deferrals → F)
```
The detail bar: button behavior, file paths, function list, state machine, error branches — all of it. If a developer would have to guess, it's not done.

## Test Doc (04-test-doc.md)
Two lives. **Plan** is written in Phase 3 and reviewed at Gate 1 (does this set of cases fully cover A?). **Report** is appended in Phase 10 with results.

**This is the QA hand-off surface.** A QA engineer (or the user) must be able to read it *without opening the test code* and (1) **re-verify the behavior by hand in the running app**, and (2) **spot a missing case and propose it as a new grid cell**. So each per-test spec carries not just what the automated test does, but **how to manually QA it** and **what variations to probe next**. The index `요약` must state **조건 → 기대결과 in one full sentence** (terse fragments like "API 500 → 배너" are not enough). Every test gets a **per-test spec** (below) with **검증 목적 / 전제조건 / 입력·조건 / 자동 테스트 스텝 / 기대결과 / 🔍 수동 QA 절차 / QA가 더 의심해볼 변형**.

**Coverage rule — test per CELL, not per case.** The unit of coverage is the **grid cell** from `00-behavior-grid.md` (each equivalence class, boundary value, and branch-complement), NOT the prose case. A case that bundles several classes (e.g. "search matches title/region/dong/type") needs **one test per class + each boundary** — collapsing them into a single test is how coverage silently thins. Cite the originating cell so the Phase-11 verifier can confirm every cell has a test. Boundaries (0/1/many, min/max/over-max, empty/whitespace/unicode), each branch's complement, and each external-call outcome are **separate rows — one assertion each**.

```markdown
# Test Doc — <feature>

## Plan — index (one row per test = per grid cell)
`요약`은 **조건 → 기대결과가 한 문장에** 담기게. 표만 훑어도 무엇을 검증하는지 알 수 있어야 함.
| TID | Cell (00-grid) | Case (A) | Layer | 요약 (조건 → 기대결과) |
|-----|----------------|----------|-------|------------------------|
| T1  | search·title-match | C5 | logic | 검색어가 **제목에만** 포함된 매물이 있을 때, 그 매물만 반환하고 지역·타입만 맞는 건 제외한다 |
| T2  | search·region-match | C5 | logic | 검색어가 **지역명에만** 일치하는 매물이 있을 때, 그 매물만 반환한다 |
| T3  | search·no-match | C5 | logic | 어떤 필드와도 일치하지 않는 검색어면 빈 배열을 반환한다(throw 없음) |
| T4  | sort·empty-list | C8 | logic | 빈 목록을 정렬하면 예외 없이 빈 배열을 그대로 반환한다 |
| T5  | error-state·render | C3 | ui-behavior | 검색 API가 500을 반환하면, 결과 리스트 대신 에러 배너+"다시 시도"가 뜨고 이전 결과는 사라진다 |

## Test Spec — per test (QA가 읽고 직접 검증·보완하는 본문)
각 테스트가 무슨 조건에서 / 어떤 스텝으로 / 무엇을 검증하는지 + **QA가 앱에서 직접 확인하는 절차**와 **추가로 의심해볼 변형**. QA는 이 섹션만 읽고 (1) 직접 재현해 검증하고 (2) 빠진 케이스를 새 grid cell로 제안할 수 있어야 함.

### T1 · 제목에만 일치하는 검색
- **Cell / Layer:** search·title-match / logic (순수 함수, DOM·네트워크 없음)
- **검증 목적:** 검색이 제목 필드를 실제로 매칭하며, 다른 필드만 맞는 매물을 잘못 포함하지 않는다.
- **전제조건:** 매물 3건 — ①제목="강남 신축 오피스텔", ②지역="강남구"(제목엔 '오피스텔' 없음), ③타입="원룸".
- **입력·조건:** `q = "오피스텔"` (①의 제목에만 매칭).
- **자동 테스트 스텝:** ① `searchListings(listings, "오피스텔")` 호출.
- **기대결과:** `[①]` 반환(길이 1), ②③ 제외. (대소문자·공백 boundary는 T2/T3·별도 셀)
- **🔍 수동 QA:** 순수 함수라 앱 UI 없이 검증 — 콘솔/REPL에서 `searchListings(샘플, "오피스텔")` 실행해 ①만 나오는지 확인. 또는 T7(UI)로 검색창에 입력해 카드 1개만 뜨는지 교차 확인.
- **QA가 더 의심해볼 변형(→ 누락 시 gap 제안):** 부분일치 vs 정확일치? "오피스텔" 대문자/영문/유니코드? 제목+지역 동시 일치 시 중복 없이 1건? 특수문자(`%`,`_`) 검색?

### T5 · 에러 상태 배너 표시
- **Cell / Layer:** error-state·render / ui-behavior (Playwright, 실제 브라우저)
- **검증 목적:** 검색 중 서버 오류(500)가 나면 사용자에게 에러를 알리고 재시도 수단을 주며, 깨진 이전 결과를 남기지 않는다.
- **전제조건:** 검색 API를 HTTP 500으로 stub. 결과가 한 번 떠 있는 상태에서 재검색.
- **입력·조건:** 검색 실행 → 서버 500 응답.
- **자동 테스트 스텝:** ① 페이지 렌더 ② 검색어 입력→검색 버튼 클릭 ③ 네트워크 500 반환 ④ `getByRole('alert')`(또는 "다시 시도" 텍스트)로 배너 조회.
- **기대결과:** 에러 배너 visible + "다시 시도" 버튼 존재, 결과 리스트 비표시. (배너 색/정렬 등 외관은 Phase 9 스크린샷에서 별도)
- **🔍 수동 QA (앱에서 직접):**
  1. 앱 실행 → DevTools Network에서 검색 요청을 500으로 막기(또는 서버 중단).
  2. 검색어 입력 후 검색.
  3. 확인: 배너 노출 · 문구 오타 · "다시 시도" 클릭 시 재요청 발생 · 이전 결과가 남지 않는지 · 스크린리더로 alert가 읽히는지.
- **QA가 더 의심해볼 변형(→ 누락 시 gap 제안):** 401/403/타임아웃/오프라인에서도 같은 배너인가? "다시 시도" 연타 시 중복요청 막히나? 에러 후 정상검색하면 배너가 사라지나? 느린 응답 시 스피너(T10)→에러 전환이 자연스러운가?

## Report  (appended P10)
- Runner: <vitest x.y>  |  E2E: <playwright x.y>
- Result: <N passed / M total>, coverage <if available>
| TID | Status | Notes |
|-----|--------|-------|
| T1  | ✅ pass | |
| T2  | ✅ pass | |
| T3  | ⏳ baseline pending user bless | |
- Failures / flakes: <none | details>
```

---

## Traceability Matrix (05-traceability.md)
The coverage proof — **one row per grid cell** (from `00-behavior-grid.md`), not per prose case, drafted in Phase 5 (status `TODO`) and filled in Phase 10. Starting from cells (not cases) is what stops a class from vanishing between the grid and the tests. An empty cell means unfinished work; never hide one.

```markdown
# Traceability — <feature>
| Cell (00-grid) | Case (A) | Test(s) (D) | Code unit | Status |
|----------------|----------|-------------|-----------|--------|
| cart·add-to-empty | C1 | T1 | cart.addItem() @ lib/cart.ts | ✅ |
| cart·remove-last | C2 | T4 | cart.removeItem() | ✅ |
| submit·error-500 | C3 | T2 | <ErrorBanner> | ✅ |
| submit·timeout (complement) | C4 | — | — | ⚠️ TODO |
```
Done = coverage holds in **both directions**: (1) **forward** — every behavior in the resolved spec maps to ≥1 grid cell (nothing well-specified was dropped before the grid; this row-set is a complete decomposition of the whole spec, not just its gaps); (2) **back** — **every grid cell** has a row with no `TODO`/`—` for in-scope cells (a cell with no test is a visible hole). Out-of-scope deferrals must be stated (`deferred`), not blank.

---

## Review (per-round files, `v<N>/06-review/r<k>.md`)
The Phase-10 review loop. **Each round is a separate file** (`06-review/r1.md`, `r2.md`, …); all kept, never edit a prior round's file. Each round has **two clearly-labeled parts**:
- **Discovery (blind)** — produced by an **independent reviewer** (fresh subagent, never the author/main loop) that sees **only the current diff + resolved spec, never a prior round**. This is why discovery findings are *re-found fresh* each round rather than carried over — feeding the reviewer r1 would anchor it. Write like a **real PR review** (bar = GitHub `@claude review`): findings **grouped by severity**, each with **exact `file:line`, the offending snippet, why it matters, the fix as code**, plus a "what's good" section and a one-line summary. Not a terse table.
- **Closure (not blind)** — a short table confirming each prior round's `fix`-dispositioned finding actually landed in the current diff. This *needs* the prior round as input, so the **main loop writes it (not the blind reviewer)** and the section is **explicitly marked non-blind**. From r2 onward only.

```markdown
# Review — <feature>

## Round 1
reviewer: code-reviewer (blind — diff + resolved spec only)   scope: <files reviewed>   suite: <N/M green>

전반적으로 <1–2문장 총평>.

### 🔴 Critical — <title>
**`path/to/file.ts:53-63`**
```ts
// the actual offending code, quoted
await admin.from('users').update({ ... }).eq('id', id)
return redirect('/ok')   // ← return value never checked
```
<why it's a bug, concretely — what breaks, when>. Fix:
```ts
const { error } = await admin.from('users').update({ ... }).eq('id', id)
if (error) return redirect(error.code === '23505' ? '/err?dup' : '/err')
```
**disposition:** ☐ fix  ☐ defer(F)  ☐ reject

### 🟡 Improvement — <title>
**`path/file.tsx:20`** — <finding + snippet + suggested code>
**disposition:** ☐ fix  ☐ defer(F)  ☐ reject

### ✅ 잘된 점
- <what's correctly done — migrations, types, integrity checks…>

**요약:** <what must change (critical) vs recommended>.

## Round 2
reviewer: code-reviewer (blind — diff + resolved spec only, did NOT see Round 1)   suite: <N/M green>

### 🔵 Closure of Round 1 (main loop — NOT blind)
| R1 finding | disposition | landed in diff? | evidence |
|------------|-------------|-----------------|----------|
| R1 critical — <title> | fix | ✅ | `file.ts:53` now checks error |
| R2 major — <title> | defer(F) | n/a — deferred | `deferred.md#f-2` |

### Discovery (blind, this round)
(new findings the fresh reviewer found in the current code — independent of R1's ids; never overwrite Round 1)
```

Each finding carries id, severity (`critical/blocker` · `major` · `minor`), `file:line`, the **code snippet**, the **fix as code**, and a **disposition the user sets** (`fix` / `defer(F)` / `reject`). The loop passes only when no open critical/major remain **and** the user approves the latest round. Produce the findings; the user dispositions — never both.

---

## Deferred & Blocked (deferred.md) (parking lot)
The single home for everything that cannot be done now or was consciously postponed — so nothing is silently dropped. A living doc: append to it the moment something is parked, in any phase. Reviewed at Gate 2, and — crucially — **proactively surfaced at the start of every run that resumes the feature**: open F items are presented to the user with the question "take any of these on now?" before work proceeds, so a deferral is never forgotten across sessions.

What lands here:
- gaps the user chose to defer (Phase 3);
- review findings dispositioned `defer` (Phase 10);
- work blocked on something external (backend/API not ready, design pending, upstream decision);
- out-of-scope items discovered mid-flow;
- decisions the user wants to postpone.

```markdown
# Deferred & Blocked — <feature>

| ID | Item | Origin | Reason | Revisit when | Links | Status |
|----|------|--------|--------|--------------|-------|--------|
| F1 | bulk-delete UX | gap P3 | postponed (v2) | next milestone | A:C7 | open |
| F2 | retry on 503 | review R1-4 | blocked-on backend retry header | endpoint ships | A:C3, traceability-row | open |
| F3 | i18n of error copy | P8 impl | out-of-scope this PR | i18n epic | — | open |
```
Reason ∈ `blocked-on <X>` / `out-of-scope` / `postponed` / `needs-decision`. **Revisit when** is a concrete condition or date, never blank — a parked item with no trigger is a lost item.

**The table is an index, not the spec of the work.** A one-line `Item` ("retry on 503") is not enough to pick the work up cold. For anything **`blocked-on` or integration-pending** (e.g. a UI built against a not-yet-shipped API), add a **detail block** below the table that states exactly **어디(Where) · 무엇이 빠졌나(What) · 무엇이 충족되면 끝(Done-when)**, so a future session/person can act without re-deriving it:

```markdown
### F2 · retry on 503  (blocked-on backend)
- **Where:** `src/api/orders.ts:42` `submitOrder()` — 현재 503에서 그냥 throw, 재시도 없음. UI는 `<ErrorBanner>`만 표시.
- **What's missing:** 서버가 `Retry-After` 헤더를 줘야 함 → 클라가 그 값만큼 자동 재시도 후 실패 시에만 배너.
- **Done when:** `/orders`가 `Retry-After`를 반환(백엔드 티켓 #123 배포)되면 → honoring 로직 구현 + 테스트 `T9` un-skip.
- **Stub now:** 503이면 즉시 배너(재시도 없이) — 임시 동작임을 코드 주석 `// TODO(F2)` 로 표시.
- **Linked:** spec `A:C3` · traceability `submit·error-503`(deferred) · test `T9`(skipped, reason=F2).
```

**No silent drop rule:** if a parked item corresponds to an Artifact-A case, that case does not just vanish — its test is marked skipped/pending *with a reason that points to the F id*, and its traceability row is marked `deferred` (not empty, not passing). An empty B cell still means unfinished; a `deferred` cell means consciously parked and tracked here.

---

## 07-verify.md — comprehensive verification report (Phase 11)
Produced after the review loop passes, handed to the user before Gate 2. Reports the conformance/coverage/separation audit + full-suite result.

```markdown
# Verify — <feature>   date: <>

## Suite
- runner: <vitest/node --test/…>   result: <N/M pass>   coverage: <if any>

## Cell coverage (every 00-grid cell → case → test)
- total cells: <N>  ·  cells with ≥1 test: <N>  ·  uncovered cells: <list — must be empty or deferred(F#)>

## Conformance (every cell exercised & ACTUALLY asserted)
| cell (00-grid) | case | test | asserts the cell? | verdict |
|----------------|------|------|-------------------|---------|
| search·type-match | C5 | T2 | yes — asserts type-only match | ✅ |
- **asserts?** is not "does it pass" — confirm the test would FAIL if the cell's behavior regressed (no trivial/always-green tests). The `spec-verifier` agent defaults to refuting this.

## Traceability (B) — no TODO/empty rows
- <status; list any deferred rows>

## Logic/UI separation
- <logic free of UI imports? UI thin? findings>

## Result
- <pass — ready for Gate 2 | issues found → back to fix>
```

## Completion Doc (08-completion.md)
The post-code report for Gate 2. Lets the user judge "built right" from docs + screenshots.

```markdown
# Completion — <feature>
date: <>   status: awaiting Gate-2 approval

## Summary
<what was built, in 3–5 sentences>

## Key decisions made
<the BLOCKER/BEHAVIORAL resolutions that shaped the code; link to A>

## Architecture — logic / UI split
- Logic: <files, pure, tested by …>
- UI: <files, thin over logic>

## How to run & verify
```
<install / test / e2e commands actually used>
```

## Test results
<paste D Report summary: N/M passing, coverage>

## Review loop
<rounds run; open findings remaining (should be none blocking); link to E>

## Screenshots (appearance baselines — need your bless)
- <state>: <path/embed>

## Deferred / blocked / residual (from F)
- <summarize open F items: what's parked and the revisit trigger; plus any assumptions/deviations recorded>

## Open for approval
- [ ] Baselines blessed
- [ ] Approved to commit (skill never commits unprompted)
```

---

## Notes
- Keep A and D in lockstep: every A case has ≥1 D test; every D test traces to an A case.
- If a decision changes after Gate 1, edit A + D and re-present — do not let docs drift from code.
- Match an existing repo doc convention if one exists rather than imposing this layout.
