# 예시 런 — 상품 검색 자동완성 (fresh · full)

실제 `/spec-to-code` 한 번을 처음부터 끝까지 돌린 기록. **불완전한 4줄 기획서 → 검증된 React 코드 + 문서 세트** 가 어떻게 나오는지 팀 공유용으로 정리.

> 핵심: 이건 "기획서 넣으면 코드 뚝딱"이 아니라, **중요한 결정마다 멈춰서 문서로 합의하며** 가는 대화형 플로우다. 사용자가 개입하는 곳은 🚪 표시.

---

## 0. 입력 — 일부러 불완전한 기획서 (4줄)

```
# 상품 검색 자동완성
- 검색창 입력 → 드롭다운에 상품 목록 추천
- 항목 클릭 → 상품 상세로 이동
- GET /api/search?q=... 로 목록 받아옴
- 디자인 시안 추후
```

호출: `/spec-to-code feature-spec.md` (React로 만든다고 명시)

## 1. Ingest & probe
- 정규화 → `01-working-spec.md`, 원본 `source/`에 아카이브
- 프로젝트 탐지: **빈 프로젝트**(React·테스트러너 없음) → 테스트 단계 전 셋업 필요로 메모
- 모드 **fresh** (이전 산출물 없음), tier **full**, **checkpoint** 모드
- 상태파일 생성 → 이 시점부터 **승인 전 코드/테스트 작성은 훅이 차단**

## 2. 갭 분석 — 4줄이 15개 구멍으로 (`00-gap-analysis.md`, 필수)
디바운스? 최소 글자수? 로딩/결과없음/에러 표시? 늦게 온 응답(stale)? 키보드 탐색? 바깥 클릭? 결과 개수? a11y? … happy-path 4줄엔 하나도 없었음.
→ **격자를 채움**(필수): 축 체크리스트 tick → 상태×이벤트 매트릭스(입력 0/1/2글자 × 응답 ok/빈/에러/stale …)의 모든 칸을 결정 or `GAP→Q`. 빈 칸 0. 그 다음 **적대적 크리틱**이 누락 축/미보완 분기를 한 번 더 훑음. (이 파일이 있어야 hook이 `02-resolved-spec.md`를 허용)

## 3 → 🚪 Gate 1 — 갭을 사용자가 결정 (추론 안 함)
중요한 결정 4개를 물음 → 답:

| 결정 | 사용자 선택 |
|---|---|
| 발동 시점 | 디바운스 300ms + 최소 2글자 |
| 결과 개수 | 상위 8개 |
| 키보드 | ↑↓·Enter·Esc 지원 |
| 상태 표시 | **결과만 (최소)** — 로딩/빈/에러 미표시 |

→ "결과만 표시(최소)" 답이 **2차 갭**을 염 (에러·결과없음 때 정말 아무것도 안 띄우나?). 가정 안 하고 명시 확인 → stale 응답은 **최신 우선(이전 취소)**, 바깥클릭 닫기 등 기본값 보고.

→ 결정 확정본 `02-resolved-spec.md` 생성 → **사용자가 파일 읽고 승인.** (승인 전엔 코드 못 씀)

> 📌 교훈: 빈 곳은 Claude가 지어내지 않고 **사용자가 파일로 승인**. "테스트로 못 쓸 만큼 모호하면 그것도 갭"이라 되물음.

## 5 → 🚪 설계 게이트 — 완벽한 개발문서
`03-design.md` 작성 (이것만 보고 개발 가능해야 함):
- 파일 구조 전부 (`lib/search/` 순수규칙+클라이언트 / `hooks/useAutocomplete` / `components/SearchAutocomplete`)
- 타입·함수 목록+시그니처
- **"입력하면 → 디바운스 → 호출 → 결과/0개/에러 분기" 단계별 동작**, 키보드·바깥클릭, 상태
→ 사용자가 읽고 승인. (승인 전 테스트·코드 차단)

## 6 → 🚪 테스트 게이트 — 테스트 먼저 (RED)
빈 프로젝트라 React+Vitest+Testing Library 셋업(npm install) → 테스트 11개 작성 → **RED 확인**(구현 없어 실패) → `04-test-doc.md` + 테스트 코드 사용자 승인 → 그제서야 구현 잠금 해제.

## 7·8 — 구현 (GREEN)
검색 로직(`queryRules`·`searchClient`) → 훅(`useAutocomplete`) → 컴포넌트(`SearchAutocomplete`) 구현 → **13/13 통과**. 로직(순수)과 UI(얇은 컴포넌트) 분리 유지.

## 9 — 시각 검증
디자인 시안 미제공 → Playwright 스크린샷 보류(deferred).

## 10 — 🔁 리뷰 루프 (독립 리뷰어)
**별도 컨텍스트의 독립 리뷰어** 가 코드를 새로 읽고 PR-급 리뷰 작성 (`06-review/r1.md`, `r2.md`):
- 라운드1 → 사용자가 R1(언마운트 cleanup)·R3(aria) **fix** 처분 → 수정
- 라운드2(재실행) → **self-review가 놓쳤던 새 버그 4개 발견** (id 미인코딩, Enter preventDefault 누락, 비배열 응답, console.error 미단언 등)

> 📌 교훈: 작성자가 자기 코드 리뷰 ❌. 독립 리뷰어가 새로 읽어야 진짜 버그가 잡힘. 라운드마다 **새 리뷰 파일**.

## 11 → 12 — 종합검증 → 🚪 Gate 2
`07-verify.md` (13/13, 케이스 11개 중 10 직접 검증) → `08-completion.md` 보고 → 사용자 최종 승인.

남은 리뷰 지적은 **"일단 승인"으로 `deferred.md`(TODO)** 에 보류 (실제 버그 2개는 코드에도 `// TODO(spec-to-code:F7/F9)` 주석). 다음 재개 시 먼저 물어봄.

---

## 결과물

```
docs/spec-to-code/product-search-autocomplete/
├── index.md · CHANGELOG.md · deferred.md(TODO) · source/
└── v1/
    ├── 01-working-spec.md   02-resolved-spec.md   03-design.md
    ├── 04-test-doc.md       05-traceability.md    06-review/{r1,r2}.md
    └── 07-verify.md         08-completion.md
src/  lib/search/* · hooks/useAutocomplete.js · components/SearchAutocomplete.jsx
test/ *.test.{js,jsx}   → vitest 13/13 ✅
```

## 한 번에 보는 교훈
1. **갭은 사용자가 결정** — 4줄이 15갭, 가정 없이 문서로 승인.
2. **게이트는 문서 + 강제** — design 승인 전 코드 차단(훅). 채팅이 아니라 파일로 승인.
3. **독립 리뷰** — self-review가 못 본 버그를 잡음. 라운드별 새 문서.
4. **no silent drop** — 미룬 건 `deferred.md` TODO + 코드 주석으로 추적.
5. **순서가 보이는 산출물** — `01~08` 번호로 워크플로우 그대로 정렬.
