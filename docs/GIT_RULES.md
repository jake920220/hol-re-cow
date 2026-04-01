# GIT_RULES.md

## Goal

이 저장소는 GSD phase 단위로 작업하며, plan / execute / review를 분리하기 위해
브랜치, worktree, 커밋 단위를 강하게 규율한다.

## Core rules

1. 기본 브랜치는 `main`으로 통일한다.
2. `main`에서는 직접 구현 작업을 하지 않는다.
3. phase마다 전용 브랜치를 만든다.
4. 병렬 세션은 반드시 별도 worktree로 분리한다.
5. review는 별도 review 브랜치 + 별도 worktree + 별도 Codex 세션에서 수행한다.
6. 같은 파일군을 두 세션이 동시에 live edit 하지 않는다.
7. 커밋은 작고 원자적으로 남긴다.
8. 스테이징 전 `git status`와 변경 파일 목록을 확인하고, 무엇을 왜 스테이징하는지 한국어로 한 줄 요약한다.
9. 현재 작업과 무관한 파일은 스테이징하지 않는다.
10. 커밋 메시지는 한국어로 간결하게 쓰고, 필요하면 하단에 세부 작업 리스트를 붙인다.
11. 사용자가 명시적으로 요청하지 않았다면 `git push`는 하지 않는다.

## Branch naming

### Phase branch

- 형식: `phase/<nn>-<slug>`
- 예시:
  - `phase/00-doc-gate`
  - `phase/01-project-shell`
  - `phase/02-auth`
  - `phase/03-feed-follow`
  - `phase/04-post-create`
  - `phase/05-mypage`

### Review branch

- 형식: `review/<nn>-<slug>`
- 예시:
  - `review/00-doc-gate`
  - `review/03-feed-follow`

### Other branches

- `hotfix/<slug>`
- `chore/<slug>`

## Worktree naming

worktree는 저장소 루트 바깥에 생성한다.

- phase worktree: `../wt-holrecow-phase-<nn>-<slug>`
- review worktree: `../wt-holrecow-review-<nn>-<slug>`

예시:

- `../wt-holrecow-phase-03-feed-follow`
- `../wt-holrecow-review-03-feed-follow`

## Bootstrap for an empty repository

현재 저장소처럼 첫 커밋이 없거나 기본 브랜치가 `master`인 초기 상태에서는 아래 순서로 기준을 맞춘다.

### 1. Default branch 이름 정리

```bash
git branch -m main
```

- unborn branch 상태에서도 먼저 `main` 기준으로 이름을 맞춘다.
- 이후부터 문서와 실제 저장소 모두 `main`을 기본 브랜치로 사용한다.

### 2. 첫 phase 브랜치에서 작업 시작

```bash
git switch -c phase/00-doc-gate
```

- 첫 구현/문서 작업도 `main`이 아니라 phase 브랜치에서 시작한다.
- 초기 문서 정비, 프로젝트 셸, 환경 세팅도 phase 또는 chore 브랜치에서 남긴다.

### 3. 첫 승인본을 main 기준선으로 삼기

첫 phase가 검토 완료되면 승인된 커밋을 `main` 기준선으로 둔다.

```bash
git branch -f main HEAD
git switch main
```

- remote가 아직 없으면 로컬 기준선만 먼저 만든다.
- remote를 연결하는 시점부터 `main`을 기본 브랜치로 사용한다.

## Standard phase workflow

### 1. main 최신화

remote가 이미 있는 경우:

```bash
git switch main
git pull origin main
```

remote가 아직 없으면 `git pull`은 생략한다.

### 2. phase 브랜치 생성

단일 세션 작업:

```bash
git switch main
git switch -c phase/02-auth
```

병렬 세션 작업:

```bash
git worktree add -b phase/02-auth ../wt-holrecow-phase-02-auth main
```

### 3. 작업 중 규칙

- 계획 범위를 벗어난 리팩토링은 하지 않는다.
- 커밋 전에는 항상 diff를 읽고, 실행한 검증 결과를 짧게 정리한다.
- phase 중간 커밋도 의미 단위로 쪼개되, 한 커밋이 한 의도를 가지도록 유지한다.

### 4. review handoff 준비

review 브랜치를 만들기 전 최소 아래를 만족한다.

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- 핵심 사용자 플로우 1차 수동 검증
- 리뷰어가 볼 포인트 정리

### 5. review 브랜치 / worktree 생성

```bash
git worktree add -b review/02-auth ../wt-holrecow-review-02-auth phase/02-auth
```

- review는 구현 branch를 직접 덮어쓰지 않는다.
- 리뷰 세션은 작은 수정만 수행하고, 범위 확대는 하지 않는다.

### 6. 머지 이후 정리

- 승인된 phase는 `main`에 반영한다.
- 사용이 끝난 worktree는 제거한다.
- 다음 phase는 항상 최신 `main` 기준에서 다시 시작한다.

## Commit checklist

커밋 전에 아래 순서를 지킨다.

1. `git status` 확인
2. 변경 파일 목록 검토
3. 스테이징 대상과 이유를 한국어 한 줄로 요약
4. `git diff --staged` 검토
5. 실행한 테스트/검증 내용 정리
6. 한국어 커밋 메시지 작성

## Commit message examples

```text
문서 게이트 기준 정비

- DESIGN.md를 Figma 보조 계약서로 보강
- GIT_RULES.md 초기 저장소 절차 정리
- DB_SCHEMA.md 초안 추가
```

```text
인증 화면 기본 셸 구현

- 이메일 로그인 폼 추가
- 소셜 로그인 버튼 구조 반영
- 에러 상태와 disabled 상태 정리
```
