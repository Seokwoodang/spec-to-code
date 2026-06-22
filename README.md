# spec-to-code

**불완전한 기획서를 완성된·검증된 코드로 바꾸는 Claude Code 플러그인.**

핵심은 기획서와 코드 *사이*의 작업 — 빈 곳을 찾아 사용자와 메우고, 결과를 증명하는 것. **확정되지 않은 기획서로는 코드를 쓰지 않습니다** (훅으로 강제).

```
어떤 포맷의 기획서 → [정규화] → [갭 발견] → [사용자와 해소] → 확정 명세 → TDD 코드 → 독립 리뷰 → 증명 문서
```

## 설치

```
/plugin marketplace add Seokwoodang/spec-to-code
/plugin install spec-to-code@spec-to-code
```
> 업데이트는 `/plugin` 메뉴에서. 기존 `/spec-to-code` 는 업데이트 후에도 그대로 작동합니다.

## 세 가지 전문 스킬

같은 게이트 TDD 척추를 공유하되, 검증·갭·설계는 도메인별로 전문화 (합본으로 어중간해지지 않게):

| 커맨드 | 영역 | 전문화 |
|---|---|---|
| `/spec-to-code-frontend` (별칭 `/spec-to-code`) | 프론트/UI | Playwright UI동작·스크린샷 · 컴포넌트 설계 |
| `/spec-to-code-backend` | 서버/API/DB | 통합·계약·마이그레이션 테스트 · 엔드포인트/스키마 · 인증/멱등성/트랜잭션 갭 |
| `/spec-to-code-fullstack` | 양쪽 | 얇은 조율자 — API 계약 합의 → backend → frontend (각 절반 그대로 전문 실행) |

단일 영역은 front/back 직접, 양쪽은 fullstack. `/spec-to-code` 는 frontend 별칭(기존 호환).

## 동작 방식

```mermaid
flowchart TD
  S([기획서 · 어떤 포맷이든]) --> P1[Ingest & probe]
  P1 --> P2[갭 분석]
  P2 --> G1{{🚪 Gate 1 · 확정명세 승인}}
  G1 --> P5[설계 doc]
  P5 --> G2{{🚪 Tests gate · 설계+RED테스트 승인}}
  G2 --> P7[구현 → GREEN]
  P7 --> R[독립 리뷰어]
  R --> G3{{🔁 사용자 처분}}
  G3 -->|open 남으면| R
  G3 --> P11[종합 검증]
  P11 --> G4{{🚪 Gate 2 · 완료 승인}}
  G4 --> DONE([✅ 완료])
  G1 -.보류.-> F[(deferred · TODO)]
  G3 -.보류.-> F
  classDef gate fill:#1f6feb,color:#fff,stroke:#1f6feb;
  class G1,G2,G3,G4 gate;
```

- **갭은 사용자가 결정** — 추론하지 않고 묻는다. 테스트로 못 쓸 만큼 모호하면 그것도 갭.
- **게이트는 문서로** — 각 하드스톱마다 MD 파일을 만들어 경로를 주고, 당신이 읽고 승인/수정. 채팅 표 아님.
- **훅으로 강제** — 설계(`03-design.md`) 승인 전엔 코드/테스트 작성이 차단됨 (scoped·fail-open).
- **독립 리뷰** — 별도 컨텍스트 리뷰어가 라운드마다 새로 리뷰 (작성자 self-review 금지).
- **fresh / update** (이전 산출물 유무) · **full / lite** (규모) 자동 판별. 업데이트는 전체 suite 회귀 검사.

## 산출물

기능별 `docs/spec-to-code/<slug>/` 에 **버전 폴더**로 저장 (마크다운, 워크플로우 순서대로 번호):

```
docs/spec-to-code/<slug>/
├── index.md · CHANGELOG.md · deferred.md(TODO) · source/   # 공통
└── v1/  01-working-spec · 02-resolved-spec · 03-design · 04-test-doc
       05-traceability · 06-review/ · 07-verify · 08-completion
```
코드·테스트는 doc home이 아니라 프로젝트 자체 위치에. 업데이트는 `v2/` 생성 후 직전 버전과 diff.

📖 **실제 런 예시**: [`examples/example-run-product-search.md`](plugins/spec-to-code/examples/example-run-product-search.md) — 불완전한 4줄 기획서 → 검증된 React 코드 전 과정.

## 구조

```
.claude-plugin/marketplace.json
plugins/spec-to-code/
├── .claude-plugin/plugin.json
├── commands/        spec-to-code(-frontend/-backend/-fullstack).md
├── agents/          gap-hunter · code-reviewer · spec-verifier  (읽기전용)
├── hooks/           gate-guard.mjs  (게이트 강제)
└── skills/          spec-to-code-{frontend,backend,fullstack}/
                     각 SKILL.md + references/ (상세) + scripts/
```
자세한 플로우·룰·산출물 규격은 각 스킬의 `SKILL.md` 와 `references/` 에 있습니다.

## 기여 / 업데이트

스킬·에이전트 수정 → `plugin.json` 의 `version` 올리고 `git push`. push하면 마켓플레이스에 반영되고, 사용자는 `/plugin` 메뉴에서 업데이트.
