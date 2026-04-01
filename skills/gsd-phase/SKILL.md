---
name: gsd-phase
description: 홀리카우 프로젝트에서 GSD phase를 시작·진행·검증·리뷰할 때 따라야 할 표준 절차를 제공한다.
---
# GSD Phase Skill

## Use when

- 새 phase를 시작할 때
- 진행 중인 phase를 이어서 작업할 때
- planner / executor / reviewer 역할을 분리할 때
- UI가 포함된 phase를 GSD 표준 흐름으로 운영할 때

## Do not use when

- 아주 작은 단일 파일 수정만 하는 경우
- hotfix 수준의 긴급 패치만 하는 경우
- phase 범위가 아직 합의되지 않은 경우

## Goal

phase 범위를 좁게 유지하고,
계획 → 구현 → 검증 → 리뷰를 분리하여 컨텍스트 오염과 작업 흔들림을 줄인다.

## Phase gate

아래 항목이 없으면 phase를 시작하지 않는다.

- `AGENTS.md`
- `docs/DESIGN.md`
- `docs/GIT_RULES.md`
- `docs/DB_SCHEMA.md`
- 현재 phase 목표 한 문장
- 검증 명령 초안
- UI phase인 경우 대상 Figma frame / component 범위

하나라도 비어 있으면 먼저 문서 게이트를 닫는다.

## Standard flow

### Frontend/UI phase

1. `/gsd:discuss-phase N`
2. `/gsd:ui-phase N`
3. `/gsd:plan-phase N`
4. `/gsd:execute-phase N`
5. `/gsd:verify-work N`
6. `/gsd:ui-review N`
7. ship 준비

### Backend-heavy phase

1. `/gsd:discuss-phase N`
2. `/gsd:plan-phase N`
3. `/gsd:execute-phase N`
4. `/gsd:verify-work N`
5. review 준비

## Branch / worktree rule

- phase마다 새 브랜치를 만든다.
- 병렬 세션은 반드시 worktree로 분리한다.
- review는 별도 review 브랜치에서 한다.
- 같은 파일을 두 세션이 동시에 live edit 하지 않는다.
- 초기 저장소라면 `docs/GIT_RULES.md`의 bootstrap 절차부터 맞춘다.

## Role split

### Planner

- phase 범위를 정리한다
- 영향 파일을 예측한다
- 리스크와 검증 포인트를 뽑는다
- Figma / DESIGN / DB schema 중 무엇이 이번 phase의 source of truth인지 명확히 적는다

### Executor

- 계획 범위 안에서만 구현한다
- atomic commit으로 자주 나눈다
- 검증 가능한 체크포인트를 만든다
- 문서에 없는 요구사항을 임의로 추가하지 않는다

### Reviewer

- 범위 일탈 여부를 본다
- 시각/상태/접근성/회귀를 확인한다
- 작은 수정만 수행한다
- phase 목표와 실제 결과가 일치하는지 먼저 본다

## Required checkpoints

각 phase에서 최소 아래를 남긴다.

- 목표
- source of truth
- 변경 파일
- 검증 명령
- 수동 확인 포인트
- 남은 리스크

## UI phase rule

UI가 있으면 반드시 아래를 확인한다.

- Figma
- `docs/DESIGN.md`
- `skills/figma-implementation/SKILL.md`
- `375 / 390 / 430` 뷰포트

## Review handoff

review 브랜치를 만들기 전:

- lint 통과
- typecheck 통과
- build 통과
- 핵심 플로우 1차 수동 검증
- 리뷰어가 볼 포인트 정리
- 범위 밖 변경이 없는지 확인

## Output

작업 시작 시:

- phase 번호와 목표
- 지금 단계
- 참고 문서
- 변경 범위
- 검증 계획

작업 종료 시:

- 완료 항목
- 검증 결과
- 남은 이슈
- review 요청 포인트
