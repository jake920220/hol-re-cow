# PHASE_HANDOFF.md

## 목적

이 문서는 홀리카우 프로젝트에서 구현 세션과 리뷰 세션이 phase마다 같은 기준으로 움직이도록 만드는 handoff 가이드다.

- 구현 세션은 `phase/<nn>-<slug>` 브랜치에서 작업한다.
- 리뷰 세션은 `review/<nn>-<slug>` 브랜치와 별도 worktree에서 작업한다.
- 두 세션은 같은 파일을 동시에 live edit 하지 않는다.
- 구현 세션이 PR을 만들고, 리뷰 세션은 그 PR을 읽고 GitHub에 리뷰 코멘트를 남긴다.
- 리뷰 세션은 로컬 검증은 할 수 있지만, 기본 원칙은 read-only reviewer다.

## 브랜치와 worktree 규칙

### 구현 세션

- 브랜치: `phase/<nn>-<slug>`
- 작업 폴더: 기본 저장소 또는 phase 전용 worktree

예시:

- 브랜치: `phase/01-project-shell`
- 폴더: `/Users/kimjunhyun/Desktop/project/hol-re-cow`

### 리뷰 세션

- 브랜치: `review/<nn>-<slug>`
- 작업 폴더: 별도 review worktree
- 역할: PR 기준 read-only 리뷰어

예시:

- 브랜치: `review/01-project-shell`
- 폴더: `../wt-holrecow-review-01-project-shell`

### review worktree 생성 예시

```bash
git worktree add -b review/01-project-shell ../wt-holrecow-review-01-project-shell phase/01-project-shell
```

- review 브랜치는 구현 브랜치와 같은 시점의 코드를 격리해서 검증하기 위한 용도다.
- review 세션은 이 브랜치에 커밋하거나 push하지 않는다.

## 구현 세션 체크리스트

구현 세션은 phase를 시작하거나 handoff를 넘기기 전에 아래를 정리한다.

1. 현재 phase 번호와 목표 한 문장
2. source of truth
3. 현재 브랜치명과 기준 커밋
4. 변경 파일
5. 실행한 검증 명령
6. 수동 확인 포인트
7. 남은 리스크
8. 리뷰어가 특히 봐야 할 포인트
9. PR 번호 또는 PR URL

## PR handoff 규칙

구현 세션은 리뷰 세션에 코드를 직접 설명하는 대신, PR을 기준으로 handoff 한다.

1. 구현 세션이 `phase/<nn>-<slug>` 브랜치에서 커밋한다.
2. 구현 세션이 PR을 생성한다.
3. 리뷰 세션은 해당 PR 번호 또는 URL을 기준으로 리뷰한다.
4. 리뷰 세션은 GitHub 코멘트와 리뷰를 남긴다.
5. 수정은 다시 구현 세션이 수행한다.

## 리뷰 세션 시작 절차

리뷰 세션은 시작하면 아래 순서로 움직인다.

1. 현재 폴더가 review worktree인지 확인한다.
2. 현재 브랜치가 `review/<nn>-<slug>`인지 확인한다.
3. 아래 문서를 읽는다.
   - `AGENTS.md`
   - `docs/GIT_RULES.md`
   - `docs/DB_SCHEMA.md`
   - `docs/DESIGN.md`
   - `docs/PHASE_HANDOFF.md`
4. `scripts/gh-review auth status`로 리뷰 봇 계정 상태를 확인한다.
5. 이번 phase의 목표와 범위를 다시 적는다.
6. PR 번호 또는 URL을 기준으로 리뷰를 진행한다.

## 리뷰 우선순위

리뷰 세션은 아래 순서로 본다.

1. 범위 일탈 여부
2. 서버/클라이언트 경계 위반
3. DB/결제/비밀정보 노출 위험
4. 공통 셸/디자인 시스템 불일치
5. 회귀 가능성
6. 누락된 상태
7. 검증 부족

## 서버 경계 규칙

리뷰 세션은 특히 아래를 강하게 본다.

- 브라우저 코드에 DB 직접 통신이 있는지
- Client Component에 비밀 키나 관리자 권한 키가 들어가는지
- 결제 관련 처리 로직이 클라이언트에 들어가는지
- 서버 전용 로직이 `server-only` 경계 밖으로 새는지

위반이 있으면 우선순위를 가장 높게 둔다.

## 리뷰 세션의 역할 범위

리뷰 세션이 기본적으로 해야 할 일은 아래다.

- PR diff 읽기
- 로컬 검증 실행
- GitHub review comment 남기기
- GitHub approval 또는 request changes 남기기
- 남은 리스크 정리

리뷰 세션은 아래를 하지 않는다.

- 코드 수정
- 커밋
- push
- PR 생성
- phase 범위 확장

예외:

- 사용자가 리뷰 세션에서 직접 작은 수정까지 허용한다고 명시한 경우에만 별도 합의 후 진행한다.

## 리뷰 세션 종료 시 남길 내용

리뷰 세션은 종료 전에 아래를 남긴다.

1. 발견한 문제
2. GitHub에 남긴 리뷰/코멘트 링크 또는 요약
3. 실행한 검증 명령
4. 남은 리스크
5. 구현 세션이 다음으로 할 일

## GitHub 계정 전략

### 구현 세션

- 구현 세션은 현재 사용 중인 기본 GitHub 계정을 사용한다.
- PR 생성, push, 브랜치 관리도 구현 세션 계정으로 한다.

### 리뷰 세션

- 리뷰 세션은 별도의 GitHub 봇 계정으로 GitHub review comment를 남긴다.
- 로컬 git `user.name` / `user.email`은 리뷰 세션에서 중요하지 않다. 리뷰 세션은 커밋하지 않기 때문이다.
- 리뷰 세션의 GitHub 인증은 `gh` CLI 전용 별도 config 디렉터리로 분리한다.

### 리뷰 봇 계정 로그인

한 번만 아래처럼 로그인해두면 된다.

```bash
GH_CONFIG_DIR="$HOME/.config/gh-holrecow-review-bot" gh auth login --web --hostname github.com
```

- 여기서 브라우저에 뜨는 GitHub 로그인 화면에서 봇 계정으로 로그인한다.
- GitHub 계정이 Google OAuth로 만들어진 계정이어도, GitHub 웹 로그인만 되면 `gh auth login --web`로 사용할 수 있다.

### 리뷰 세션에서 `gh` 사용 규칙

- 리뷰 세션은 항상 `scripts/gh-review` 래퍼를 사용한다.
- plain `gh` 대신 아래처럼 쓴다.
- GitHub 계정 분리가 필요한 경우, Codex의 GitHub 앱 커넥터 대신 `scripts/gh-review`를 우선 사용한다.

```bash
scripts/gh-review auth status
scripts/gh-review pr view <PR_NUMBER> --comments
scripts/gh-review pr review <PR_NUMBER> --comment --body "..."
```

- 이렇게 해야 리뷰 세션만 봇 계정 config를 사용하고, 구현 세션의 기본 계정과 충돌하지 않는다.

## 다음 phase로 넘어갈 때

phase가 바뀌면 이전 handoff를 끌고 가지 말고, 아래를 새로 만든다.

1. 구현 브랜치: `phase/<next>-<slug>`
2. 리뷰 브랜치: `review/<next>-<slug>`
3. review worktree
4. 새 phase 목표
5. 새 phase 검증 기준

## 새 리뷰 스레드에서 바로 쓸 문구

아래 문구를 새 리뷰 세션에 그대로 전달하면 된다.

```text
너는 n번 페이즈 리뷰를 담당하는 세션이야.
docs/PHASE_HANDOFF.md를 먼저 읽고,
AGENTS.md, docs/GIT_RULES.md, docs/DB_SCHEMA.md, docs/DESIGN.md를 확인한 다음
phase n PR 리뷰를 진행해줘.

리뷰 세션에서는 scripts/gh-review만 사용해서 GitHub 코멘트를 남겨줘.
코드는 수정하지 말고, PR을 읽고 검증한 뒤 review comment 또는 request changes를 남겨줘.

우선순위:
1. 범위 일탈
2. 서버/클라이언트 경계 위반
3. DB/결제/비밀정보 노출 위험
4. 공통 셸과 디자인 정합성
5. 회귀 리스크
```
