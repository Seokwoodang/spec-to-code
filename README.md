# spec-to-code

**불완전한 기획서를 완성된·검증된 코드로 바꾸는 Claude Code 플러그인.**

핵심 가치는 기획서와 코드 *사이*의 작업에 있습니다 — 기획서가 말하지 않은 빈 곳을 찾아내고, 사용자와 함께 메우고, 결과를 증명하는 것. **확정되지 않은 기획서로는 절대 코드를 쓰지 않습니다.**

```
어떤 포맷의 기획서 → [정규화] → [갭 발견] → [사용자와 해소] → 확정 명세 → TDD 코드 → 리뷰 루프 → 증명 문서
```

---

## 설치

```
/plugin marketplace add Seokwoodang/spec-to-code
/plugin install spec-to-code@spec-to-code
```

설치하면 `/spec-to-code` 커맨드, 스킬, 번들 에이전트 3종이 활성화됩니다.

> 업데이트가 나오면 `/plugin` 메뉴에서 받을 수 있습니다.

---

## 사용법

호출은 항상 똑같습니다 — 기획서를 던지기만 하면 됩니다 (포맷 자유: md · HTML · PDF · 이미지/Figma · docx · URL · 붙여넣기 텍스트):

```
/spec-to-code  docs/feature-x.md
```

**모드는 자동 판별됩니다.** `docs/spec-to-code/<기능명>/` 에 이전 산출물이 없으면 **첫 개발(Fresh)**, 있으면 **업데이트(Update)** 로 전환됩니다. 즉 사용자가 모드를 고를 필요 없이, 같은 기능에 두 번째로 기획서를 주면 알아서 델타 모드로 돕니다.

개입 지점(체크포인트)은 **두 모드** 로 조절합니다. 낮은 값어치 단계(수집·갭분석·종합검증)는 양쪽 다 안 멈추고 보여주고 진행하며, **리뷰 루프는 두 모드 다 사용자와 함께** 돕니다(절대 혼자 안 함). 커밋은 **명시적 지시 때만**.

| 모드 | 멈추는 곳 | 용도 |
|---|---|---|
| **checkpoint (기본)** | 4개 하드스톱: ① 확정명세+테스트계획 ② 설계+RED 테스트(구현 전) ③ 코드+리뷰루프 ④ 최종 | 균형 |
| **step-through** | 위 + 설계·로직·UI·시각검증을 **각각** 개별 멈춤 | 최대 통제 ("꼼꼼히 가자") |

> 왜 전 페이즈를 다 안 멈추나: 하드스톱이 너무 많으면 안 읽고 통과시키는 **승인 연극** 이 되어 오히려 위험. 멈춤은 *판단이 결과를 바꾸고 되돌리기 비싼* 지점에만 둡니다.

### full vs lite — 규모에 맞춰 자동 조절

호출은 똑같지만, Phase 1의 빠른 스캔이 변경 규모를 보고 **tier** 를 고릅니다 (fresh/update 와 독립):

| | full | lite |
|---|---|---|
| 언제 | 크거나 불확실한 작업 | 작고 명확한 변경 ("버튼 하나 더") |
| 단계 | 12 페이즈 | 4 단계 |
| 게이트 | 4개 하드스톱 (checkpoint 모드, step-through면 더) | **1개** (확인) |
| 문서 | 전체 산출물 세트 | **CHANGELOG 엔트리 1개** |
| 에이전트 | gap-hunter·code-reviewer·spec-verifier fan-out | 인라인 |
| 안전 코어 | — 양쪽 동일 — | 갭은 사용자 해소·test-first·(업데이트면) 회귀·무단 커밋 금지 |

- **트리거**: 자동 판정 + 사용자 명시("가볍게") override. 단 스캔에서 blocker 나오면 lite여도 full로 **자동 승격**.
- **escalation**: lite로 시작했다 숨은 복잡도/예상외 회귀 발견 시 → "이거 생각보다 큰데 full로 전환할게요" 하고 full로 확장. lite가 큰 변경을 조용히 삼키지 않음.

### 산출물은 어디에 / 어떤 형식으로

모든 산출물은 기능별 **doc home** — `docs/spec-to-code/<slug>/` — 에 **마크다운** 으로 저장됩니다 (레포에 자체 docs 컨벤션이 있으면 그 아래에 배치, Phase 1에서 한 번 결정). `<slug>` 은 소문자 케밥케이스(예: `cart-bulk-delete`)이며 기능의 정체성 — 업데이트 시 이 이름으로 이전 작업을 찾습니다.

**버전별 폴더** 로 저장됩니다 — 기획서 버전마다(`v1`, `v2`…) 산출물 세트를 통째로 보존. 파일명은 **설명형(레터 없음)**:

```
docs/spec-to-code/<slug>/
├── index.md           [공통] 개요 + 버전 목록 + 최신 링크
├── CHANGELOG.md       [공통] 버전 간 run 로그 (변경·할 일 체크리스트·회귀)
├── deferred.md        [공통] 미결/보류 TODO (버전 누적)
├── source/            [공통] run별 원본 기획서 verbatim 아카이브
├── v1/                기획서 v1 산출물 세트
│   ├── working-spec.md   정규화 스냅샷 (다음 버전 diff 기준)
│   ├── resolved-spec.md  확정 명세 (Gate 1)
│   ├── design.md         완벽한 개발문서 — 파일·함수·동작 전부 (Phase 5)
│   ├── test-doc.md       테스트 계획 → 리포트
│   ├── traceability.md   추적 매트릭스 (명세↔테스트↔코드)
│   ├── review/r1.md…     독립 리뷰 라운드 (전부 보존)
│   ├── verify.md         종합 검증 (Phase 11)
│   └── completion.md     완료 보고 (Gate 2)
└── v2/                업데이트마다 새 버전 폴더
```
> 업데이트는 새 `v(N+1)/` 를 만들고 직전 `vN/working-spec.md` 와 diff. 코드·테스트는 doc home이 아니라 프로젝트 자체 위치에.

> **게이트는 문서 기반입니다.** 각 하드스톱마다 위 MD 파일을 만들어 **경로를 알려주고, 당신이 파일을 열어 읽고 승인하거나 직접 수정**합니다 (수정본이 곧 승인본). 채팅 표가 아니라 **열고·diff하고·고칠 수 있는 파일** 로 승인합니다. 리뷰 라운드 등 모든 버전은 보존됩니다.

- **코드·테스트**: doc home이 아니라 **프로젝트 자체 컨벤션 위치**에 (Phase 1에서 감지).
- **스크린샷·baseline**: Playwright가 두는 곳(e2e 테스트 옆 `*-snapshots/`)에 저장·커밋되고, completion.md 가 링크로 참조.

| 체크포인트 | 받는 것 | 하는 것 |
|---|---|---|
| 🚪 **Gate 1** (코딩 전) | 갭 질문 + 확정 명세(resolved-spec.md) + 테스트 계획(D) | 빈 곳 답하고 → 진행 승인 |
| 🔁 **리뷰 루프** (반복) | 리뷰 문서(review/) | finding별 accept/reject/defer → 통과 시 다음 |
| 🚪 **Gate 2** (완료 후) | 완료 문서(completion.md) + 테스트 결과 + 스크린샷 + 미결(deferred.md) | baseline 승인 → 최종 OK |

### 첫 개발 vs 업데이트 — 무엇이 다른가

| | 🆕 첫 개발 (Fresh) | 🔄 업데이트 (Update) |
|---|---|---|
| **트리거** | 그 기능의 첫 `/spec-to-code` | 같은 기능에 새/수정 기획서로 다시 `/spec-to-code` (자동 감지) |
| **시작 동작** | 기획서를 0부터 정규화 | 새 기획서 ↔ 저장된 **`working-spec.md` 스냅샷** **diff** + 이전 산출물 로드 + **막힌 항목(deferred.md) 재점검** |
| **갭/Gate 1** | 기능 전체의 빈 곳을 다 질문 | **바뀐 부분의 갭만** 질문 + 변경이 건드린 기존 일탈/가정 재확인 |
| **작업 범위** | 전체 구현 | **델타만** — 영향 분석(traceability.md 역색인)으로 바뀐 케이스·테스트·코드만 손댐 |
| **작업 계획서** | A/D 가 곧 계획 | **`CHANGELOG.md` 의 할 일 체크리스트** — 델타 Gate 1에서 "이번 업데이트에 뭘 할지" 승인받고 완료까지 체크 |
| **테스트** | 전 케이스 TDD (RED→GREEN) | 변경분 TDD + **전체 기존 suite 회귀 검사** (의도된 변경 외엔 다 통과해야 함) |
| **핵심 보장** | 모든 명세 케이스 커버 | **개정이 기존 케이스를 조용히 깨뜨리지 않음** |

#### 기존 기획서는 어디에 저장되고, 어떻게 "같은 기능" 인지 아는가

- **저장 위치**: 첫 개발 Phase 1에서 기획서를 정규화한 **스냅샷을 `docs/spec-to-code/<기능명>/working-spec.md` 에 저장**합니다. 원본 기획서는 사용자가 두던 곳(예: `doc/` 트리, Figma, 붙여넣기)에 그대로 두고 **경로/링크만 기록** — 원본은 옮기거나 수정하지 않습니다. 업데이트 때 diff 의 기준은 이 스냅샷입니다 (원본은 이동·수정·휘발될 수 있으므로).
- **기능 식별(slug)**: `docs/spec-to-code/<기능명>/` 의 디렉토리 이름이 곧 기능의 정체성입니다. 새 기획서를 주면 기존 slug 목록과 제목/범위로 매칭하고, **애매하면("feature-x-v2.html" 처럼 이름이 다를 때) 어느 기능의 개정인지 사용자에게 물어봅니다** — 잘못 매칭하면 엉뚱한 기준과 diff 되어 전부 틀어지기 때문.

> 💡 업데이트가 제대로 돌려면 첫 개발이 이 플로우로 진행돼 `docs/spec-to-code/<기능명>/` 에 `working-spec.md` 와 산출물(특히 추적 매트릭스 traceability.md)이 남아 있어야 합니다. 이 플로우 없이 만든 기존 코드를 업데이트하려면, 먼저 기존 코드+테스트에서 working-spec·resolved-spec·traceability를 역으로 만들어두고 진행합니다.

---

## 동작 방식

### 12 페이즈 플로우

| # | 페이즈 | 산출 | 정지 |
|---|--------|------|------|
| 1 | Ingest & probe | 정규화된 working spec + 환경 탐지 (러너/UI/Playwright/모드) | — |
| 2 | 갭 분석 | 갭 목록 (전수) | — |
| 3 | 갭 해소 | `resolved-spec.md` (확정 명세) | — |
| 4 | **🚪 Gate 1** | 사용자가 `resolved-spec.md` 승인 | **하드 스톱** |
| 5 | 설계 | `design.md`(완벽한 개발문서) + `traceability.md`(초안) | 🟠 |
| 6 | **🚪 테스트 먼저** | 테스트(RED) + `test-doc.md` → 구현 전 승인 | **하드 스톱** |
| 7 | 로직 구현 | 로직 테스트 **GREEN** | — |
| 8 | UI 구현 | UI 동작 테스트 **GREEN** | — |
| 9 | 시각 검증 | Playwright 스크린샷 → baseline 후보 | 🟠 |
| 10 | **🔁 리뷰 루프** | **독립 리뷰어** → `review/r1.md, r2.md…`; 사용자 처분 → 재리뷰 | **하드 스톱** |
| 11 | 종합 검증 | `traceability.md` 채움 + `verify.md`; spec정합·전체suite·분리 | — |
| 12 | **🚪 Gate 2** | `completion.md` + `verify.md` + `traceability.md` + `review/` + `deferred.md` 보고 | **하드 스톱** |

### 두 가지 핵심 룰

1. **갭은 사용자가 해소한다** — 기획서가 침묵/모호하면 추론하지 않고 묻는다. (사소·가역·관례적 기본값만 보고 후 가정 허용)
2. **테스트로 못 쓰는 요구는 아직 갭이다** — 테스트 불가 = 명세 부족. 코딩 전에 사용자에게 돌려보낸다.

### 검증 3층

| 층 | 검증 대상 | 도구 |
|----|-----------|------|
| 로직 | 규칙·계산·상태기계·에러 처리 | 단위테스트 TDD (red→green) |
| UI 동작 | 상태→화면, 인터랙션, 조건부 렌더, 에러 표시 | Playwright E2E |
| UI 외형 | 픽셀·레이아웃·정렬·스타일 | Playwright 스크린샷 (사용자가 1회 baseline 승인 → 이후 자동 회귀 감시) |

### 산출물 (사용자의 검증 표면 — 설명형 파일명)

코드를 다 읽지 않고 문서로 "제대로 했는지" 확인하기 위한 문서들 (`v<N>/` 안, deferred만 공통):

- **`resolved-spec.md`** — 모든 결정·케이스·엣지·에러를 못박은 계약 (Gate 1)
- **`design.md`** — 완벽한 개발문서: 파일 구조·함수 목록+시그니처·버튼 동작·상태·에러분기 전부 (Gate 전 승인)
- **`test-doc.md`** — 테스트 계획(케이스 목록) → 리포트(결과·커버리지)
- **`traceability.md`** — 명세 ↔ 테스트 ↔ 코드 ↔ 통과여부 (커버리지 증명; 빈 칸 = 미완료)
- **`review/r1.md, r2.md…`** — **독립 리뷰어** 의 라운드별 리뷰 (전부 보존)
- **`verify.md`** — 종합 검증 리포트
- **`completion.md`** — 요약·결정·실행/검증법·스크린샷·잔여
- **`deferred.md`** [공통] — 막힘·미룸·out-of-scope TODO를 **재개 트리거와 함께** 모음. 조용히 누락 안 됨(**no silent drop**), 재개 때 먼저 물어봄.

### 번들 에이전트 (전부 읽기 전용)

- **gap-hunter** — Phase 2 병렬 갭 조사 (섹션별·렌즈별)
- **code-reviewer** — Phase 10 리뷰 루프 (확정 명세 대조 + 품질/버그/보안/분리)
- **spec-verifier** — Phase 11 적대적 검증 (refute-by-default)

스킬은 에이전트가 없는 환경에서도 `Explore`/인라인으로 **graceful fallback** 됩니다.

### 게이트 강제 (gate guard)

게이트는 "지시" 가 아니라 **구조적으로 강제** 됩니다. 번들 PreToolUse 훅(`hooks/gate-guard.mjs`)이:

- 실행 중인 작업(`.spec-to-code-state.json` 의 `active:true`)이 단계별로 **design.md 미승인 → 코드·테스트 전부 차단, 테스트 미승인 → 구현 차단** (doc home 문서·상태파일은 편집 허용)
- `designApproved`→`testsApproved` 순으로 승인돼야 단계적으로 풀림 (설계 없이 코딩 불가)
- **scoped + fail-open**: 활성 상태파일이 없으면 완전 무동작 → 다른 프로젝트의 일반 코딩엔 전혀 간섭 안 함. 훅 오류 시에도 차단이 아니라 통과.

즉 "확정 명세 없이 코딩 시작" 이 **불가능** 해집니다 (skill=두뇌, hook=가드레일).

---

## 디렉토리 구조

```
.claude-plugin/marketplace.json      마켓플레이스 매니페스트
plugins/spec-to-code/
├── .claude-plugin/plugin.json       플러그인 매니페스트
├── commands/spec-to-code.md         /spec-to-code 진입점
├── agents/
│   ├── gap-hunter.md                병렬 갭 분석 (읽기전용)
│   ├── code-reviewer.md             리뷰 루프 리뷰어 (읽기전용)
│   └── spec-verifier.md             적대적 검증 (읽기전용)
└── skills/spec-to-code/
    ├── SKILL.md                     플로우 본체 (척추)
    ├── references/
    │   ├── spec-ingestion.md        포맷별 수집·정규화
    │   ├── gap-analysis.md          갭 택소노미 + 질문 패턴
    │   ├── verification.md          검증 3층 스택
    │   ├── documents.md             산출물 템플릿 (resolved-spec·design·test-doc·traceability·review·verify·completion·deferred)
    │   └── spec-update.md           업데이트(델타) 모드
    └── scripts/verify-workflow.js   Phase 11 종합검증 워크플로우
```

---

## 기여 / 업데이트

```bash
# 스킬/에이전트 수정 후
# plugins/spec-to-code/.claude-plugin/plugin.json 의 version 올리고
git add -A && git commit -m "..." && git push
```

push하면 마켓플레이스에 반영되고, 사용자는 `/plugin` 메뉴에서 업데이트를 받습니다.
