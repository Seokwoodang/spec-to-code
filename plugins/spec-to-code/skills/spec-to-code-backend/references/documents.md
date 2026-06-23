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
slug: <slug>   phase: 2   fan-out: <ran N gap-hunters per endpoint/section | inline (below threshold)>

## Axis checklist (every axis explicitly TICKED or marked N/A — forces recall of the one thing the grid can't: a forgotten axis)
- [ ] request inputs/params/body + boundaries (empty/min/max/over-max/malformed/unicode/very-long)
- [ ] auth / roles / scopes (and unauthenticated/forbidden)
- [ ] resource & DB states (absent/exists/stale/locked/soft-deleted)
- [ ] downstream-call outcomes (ok/empty/error/timeout/partial)
- [ ] concurrency (retry, idempotency/dupes, race, lost update)
- [ ] rate limits / quotas  ·  [ ] pagination/filter/sort contracts
- [ ] error model (status codes + machine codes)  ·  [ ] data lifecycle (retention, soft delete)
- [ ] audit / logging  ·  [ ] performance limits  ·  [ ] feature flags
> Any box left unticked without an explicit N·A is itself a gap. The grid below enumerates combinations *within* these ticked axes.

## Decision table(s)
| <condition A> | <condition B> | … | → response / status / effect |
|---|---|---|---|
| … | … | | <decided behavior, or **GAP→Q#**> |

## State × event matrix
| state \ event | <ev1> | <ev2> | … |
|---|---|---|---|
| <state1> | <next/effect> | <next/effect> | |

## Branch-complement checklist (every "when X" → its "not-X")
- [x] when X → A · NOT-X → <decided / GAP→Q#>

## Adversarial completeness critic
- ran: <yes>  ·  findings: <empty cells / missing axes / uncomplemented branches> → folded in / parked (F#)

## Open gaps → Gate-1 questions
- Q1 (<axis/cell>, severity): <question>
```
**Exit:** zero empty cells (each a decision or flagged GAP), critic run, every branch complemented, every resolved item test-shaped. These open Q's flow into the resolved spec's Decisions table.

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

**This is the QA hand-off surface.** A QA engineer (or the user) must be able to read it *without opening the test code* and (1) **re-verify the behavior by hand against a running API** (curl/Postman + a DB peek), and (2) **spot a missing case and propose it as a new grid cell**. So each per-test spec carries not just what the automated test does, but **how to manually QA it** and **what variations to probe next**. The index `요약` must state **조건 → 기대결과 in one full sentence** (terse fragments like "중복 키 → 409" are not enough). Every test gets a **per-test spec** (below) with **검증 목적 / 전제조건(데이터·인증·외부 stub) / 요청·조건 / 자동 테스트 스텝 / 기대결과(상태코드·바디·DB·부작용) / 🔍 수동 QA 절차 / QA가 더 의심해볼 변형**.

**Coverage rule — test per CELL, not per case.** The unit of coverage is the **grid cell** from `00-behavior-grid.md` (each equivalence class, boundary, branch-complement, and external/DB outcome), NOT the prose case. A case that bundles several classes needs **one test per class**; collapsing them is how coverage silently thins. Cite the originating cell. Boundaries (empty/min/max/over-max/malformed/unicode), each complement, each downstream outcome (ok/empty/error/timeout/partial), and auth/role variants are **separate rows — one assertion each**.

```markdown
# Test Doc — <feature>

## Plan — index (one row per test = per grid cell)
`요약`은 **조건 → 기대결과가 한 문장에** 담기게. 표만 훑어도 무엇을 검증하는지 알 수 있어야 함.
| TID | Cell (00-grid) | Case (A) | Layer | 요약 (조건 → 기대결과) |
|-----|----------------|----------|-------|------------------------|
| T1  | create·valid | C1 | integration | 인증된 사용자가 유효 바디로 POST하면 201과 함께 row가 1건 생성된다 |
| T2  | create·dup-key | C2 | integration | 이미 존재하는 키로 다시 POST하면 409를 주고 row를 추가로 만들지 않는다(멱등) |
| T3  | create·unauthenticated | C3 | contract | 토큰 없이 POST하면 401을 주고 어떤 쓰기도 하지 않는다 |
| T4  | create·db-timeout | C4 | integration | 쓰기 중 DB가 타임아웃나면 503을 주고 부분쓰기 없이 롤백된다 |

## Test Spec — per test (QA가 읽고 직접 검증·보완하는 본문)
각 테스트가 무슨 조건에서 / 어떤 스텝으로 / 무엇을 검증하는지 + **QA가 실행 중인 API에 직접 확인하는 절차**와 **추가로 의심해볼 변형**. QA는 이 섹션만 읽고 (1) curl/Postman+DB조회로 재현해 검증하고 (2) 빠진 케이스를 새 grid cell로 제안할 수 있어야 함.

### T2 · 중복 키 생성은 멱등 처리
- **Cell / Layer:** create·dup-key / integration (실제 DB·라우트)
- **검증 목적:** 같은 키로 두 번 생성 요청이 와도 데이터가 중복되지 않고 일관된 충돌 응답을 준다.
- **전제조건:** 인증된 사용자. `orders`에 `key="K1"` row가 **이미 존재**. 같은 사용자/권한.
- **요청·조건:** `POST /orders { key: "K1", ... }` (기존과 동일 키).
- **자동 테스트 스텝:** ① 시드: `key="K1"` row 1건 삽입 ② 동일 키로 `POST /orders` 호출 ③ 응답 상태·바디 확인 + DB row 수 재조회.
- **기대결과:** `409` 반환, 에러 바디에 충돌 표시. `orders`의 `key="K1"` row는 **여전히 1건**(중복 삽입 없음). 후속 큐 발행 등 부작용 없음.
- **🔍 수동 QA (실행 중 API):**
  1. `curl -X POST .../orders -H "Authorization: Bearer <t>" -d '{"key":"K1",...}'` 를 **두 번** 실행.
  2. 두 번째 응답이 409인지 확인.
  3. `SELECT count(*) FROM orders WHERE key='K1';` → **1** 인지 DB로 직접 확인.
- **QA가 더 의심해볼 변형(→ 누락 시 gap 제안):** 두 요청이 **동시(병렬)** 로 오면? 같은 키 + **다른 바디**면 409인가 덮어쓰기인가? 다른 사용자가 같은 키를 쓰면? 키 대소문자/공백 차이는 같은 키로 보나?

### T4 · DB 타임아웃 시 부분쓰기 금지
- **Cell / Layer:** create·db-timeout / integration
- **검증 목적:** 쓰기 도중 인프라 장애가 나도 데이터가 반쪽만 남지 않고(원자성) 안전한 에러를 준다.
- **전제조건:** 인증된 사용자. DB 레이어가 쓰기 중 타임아웃을 던지도록 stub/주입.
- **요청·조건:** `POST /orders { ...valid }` 도중 DB 타임아웃 발생.
- **자동 테스트 스텝:** ① DB write가 타임아웃을 던지게 설정 ② 유효 바디로 `POST /orders` 호출 ③ 응답 + 트랜잭션 후 테이블 상태 확인.
- **기대결과:** `503` 반환. 트랜잭션 롤백되어 **새 row 없음**(부분쓰기 0). 민감정보(스택트레이스·쿼리)가 에러 메시지로 새지 않음.
- **🔍 수동 QA (실행 중 API):** 보통 자동 테스트로만 재현(타임아웃 주입). 수동이면 DB `statement_timeout`을 아주 낮게 잡거나 네트워크 지연을 걸고 POST → 503 확인 후 `SELECT count(*)` 로 row가 안 늘었는지 확인.
- **QA가 더 의심해볼 변형(→ 누락 시 gap 제안):** 다단계 쓰기(주문+결제) 중간 실패 시 앞 단계도 롤백되나? 타임아웃과 **커넥션 끊김**이 같은 503인가? 재시도 시 중복 생성되나(멱등키 연계)? 로그엔 어디까지 남나?

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
| create·valid | C1 | T1 | createOrder() @ svc/order.ts | ✅ |
| create·dup-key | C2 | T2 | createOrder() (conflict path) | ✅ |
| create·unauthenticated | C3 | T3 | authGuard | ✅ |
| create·db-timeout (complement) | C4 | — | — | ⚠️ TODO |
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

**The table is an index, not the spec of the work.** A one-line `Item` ("retry on 503") is not enough to pick the work up cold. For anything **`blocked-on` or integration-pending** (e.g. a handler stubbed against a not-yet-ready upstream service or migration), add a **detail block** below the table that states exactly **어디(Where) · 무엇이 빠졌나(What) · 무엇이 충족되면 끝(Done-when)**, so a future session/person can act without re-deriving it:

```markdown
### F2 · 결제 캡처 연동  (blocked-on payments service)
- **Where:** `src/services/order.ts:88` `capturePayment()` — 현재 `return { ok: true }` 로 **mock**, 실제 PSP 호출 없음.
- **What's missing:** 결제 서비스의 `POST /capture` 계약 미확정(멱등키·부분환불 응답 형태). 외부 팀 대기.
- **Done when:** payments 팀이 `/capture` 계약 확정·스테이징 배포되면 → 실제 호출+에러매핑 구현, 통합테스트 `T7`(skipped) un-skip, 멱등 셀 `capture·dup` 추가 검토.
- **Stub now:** 항상 성공 반환 — `// TODO(F2)` 주석 + 통합테스트는 `test.skip(reason=F2)`.
- **Linked:** spec `A:C7` · traceability `order·capture`(deferred) · test `T7`(skipped, reason=F2).
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
| create·dup-key | C2 | T2 | yes — asserts 409 on conflict | ✅ |
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
