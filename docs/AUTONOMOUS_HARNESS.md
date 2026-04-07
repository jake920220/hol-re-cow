# AUTONOMOUS_HARNESS.md

## 목표

이 문서는 홀리카우 phase 구현 세션과 review 세션을 자동으로 반복 실행하는 v1 하네스 사용법을 설명한다.

v1 하네스는 아래 루프를 수행한다.

1. phase worktree 생성
2. Codex phase 세션 실행
3. 검증 완료 후 branch push + PR 생성
4. review worktree 생성
5. Codex review 세션 실행
6. 리뷰 세션이 `[리뷰어]` 태그로 PR 코멘트를 남김
7. phase 세션이 `[구현자]` 태그로 리뷰를 반영하거나 반박
8. 재검증 후 push
9. 리뷰 결과가 approved 면 merge 진행
10. merge 후 worktree 정리
11. 다음 phase로 진행

## GitHub 계정 역할 고정 규칙

하네스는 GitHub 계정 하나만 사용한다.

- PR 생성, branch push, 리뷰 코멘트 작성, reconcile 코멘트 작성, 최종 merge 주체는 항상 `jake920220` 이다.
- 구현 세션이 남기는 코멘트와 PR 본문에는 항상 `[구현자]` 태그를 붙인다.
- 리뷰 세션이 남기는 코멘트에는 항상 `[리뷰어]` 태그를 붙인다.
- 같은 계정으로는 GitHub 공식 approve/request-changes review 를 자기 PR에 남길 수 없으므로, 하네스는 review state 대신 태그 코멘트와 로컬 verdict 로 흐름을 제어한다.

CLI 규칙:

- phase/main/review worktree 에서 사용하는 plain `gh` 는 모두 `jake920220` 계정이어야 한다.
- `scripts/gh-review` 는 더 이상 별도 계정 분리 목적이 아니라, 기존 호출 호환성을 위한 thin wrapper 로만 유지한다.
- merge 는 리뷰 세션의 local verdict 가 approved 일 때 phase worktree 의 plain `gh` 로 실행한다.

## 현재 포함된 phase

v1 기본 설정은 아래 phase를 대상으로 한다.

- phase 03: `feed-follow`
- phase 04: `post-create`
- phase 05: `mypage`

설정 파일:

- `automation/harness/config.json`

새 phase를 더 자동화하려면 위 파일에 phase 정의를 추가한다.

## 실행 명령

상태 확인:

```bash
pnpm harness:status
```

phase 03부터 연속 실행:

```bash
pnpm harness:run -- --from 03
```

한 phase만 실행:

```bash
pnpm harness:run -- --from 03 --once
```

dry-run:

```bash
pnpm harness:run -- --from 03 --dry-run
```

## 런타임 상태

하네스 런타임 파일은 아래 경로에 저장한다.

- `.holrecow-harness/state.json`
- `.holrecow-harness/phases/*`

이 경로는 gitignore 대상이다.

## 완전자동화 전제 조건

아래 조건이 충족되어야 하네스가 사람 개입 없이 계속 진행할 수 있다.

1. 현재 시작 기준 phase가 `main`에 반영되어 있어야 한다.
2. 실행하는 worktree가 clean 상태여야 한다.
3. `gh auth status`가 통과해야 한다.
4. `gh api user` 가 `jake920220` 을 반환해야 한다.
5. phase에서 필요한 외부 환경변수와 비밀키가 이미 세팅되어 있어야 한다.
6. Figma source of truth나 요구사항 문서가 phase마다 충분히 명확해야 한다.

## 지금 사용자에게 필요한 것

v1 하네스를 실제로 완전자동으로 돌리려면 현재 기준으로 아래만 준비하면 된다.

1. phase 02를 merge 가능한 상태로 정리하고 `main`에 반영한다.
2. 이후 `main` 기준 clean worktree에서 `pnpm harness:run -- --from 03`를 실행한다.

이미 확인해야 하는 상태:

- plain `gh` 가 `jake920220` 으로 동작해야 한다.
- 새 phase/review worktree의 의존성은 하네스가 `pnpm install --frozen-lockfile`로 자동 bootstrap 한다.

## v1 제한

- review 결과는 inline comment 대신 PR review body 중심으로 남긴다.
- human reviewer의 자유 형식 코멘트까지 자동 분류하지는 않는다.
- 회색지대 요구사항이나 외부 설정 부족이 발생하면 해당 phase에서 중단한다.
- merge 이후 배포나 운영 검증은 아직 포함하지 않는다.
- Codex phase/review 세션은 timeout이 걸려 있으며, timeout 시 해당 phase를 blocked/failed 로 멈춘다.

## 권장 운영 방식

1. 현재 phase를 merge한다.
2. 하네스를 켠다.
3. 하네스가 phase 03~05를 순차 수행한다.
4. 최종적으로 완성된 MVP만 직접 테스트하고 피드백한다.
