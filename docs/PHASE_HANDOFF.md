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
4. 리뷰 세션은 GitHub 코멘트를 남긴다.
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
4. `gh api user`로 현재 GitHub 계정이 `jake920220` 인지 확인한다.
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
- GitHub 코멘트 남기기
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
- 홀리카우 하네스 기준 구현 세션 계정은 `jake920220` 으로 고정한다.
- 리뷰 결과를 반영하는 추가 커밋, PR 대댓글, reconcile 코멘트, 최종 merge 도 구현 세션 계정이 담당한다.
- 구현 세션이 PR 본문 또는 PR 코멘트를 남길 때는 항상 앞에 `[구현자]` 태그를 붙인다.

### 리뷰 세션

- 리뷰 세션도 같은 GitHub 계정 `jake920220` 을 사용한다.
- 같은 계정으로는 자기 PR에 공식 approve/request-changes review 를 남길 수 없으므로, 리뷰 세션은 `[리뷰어]` 태그가 붙은 PR 코멘트만 남긴다.
- 로컬 git `user.name` / `user.email`은 리뷰 세션에서 중요하지 않다. 리뷰 세션은 커밋하지 않기 때문이다.
- 리뷰 세션은 코드 수정/merge 를 맡지 않는다.

### 리뷰 세션에서 `gh` 사용 규칙

- 리뷰 세션은 plain `gh` 또는 `scripts/gh-review` 래퍼를 쓸 수 있다.
- 다만 둘 다 실제로는 같은 GitHub 계정 `jake920220` 을 사용한다.
- 리뷰 코멘트 본문 맨 앞에는 반드시 `[리뷰어]` 태그를 붙인다.

```bash
gh api user
gh pr view <PR_NUMBER> --comments
gh pr comment <PR_NUMBER> --body "[리뷰어] ..."
```

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

리뷰 세션에서는 같은 계정 `jake920220` 으로 GitHub 코멘트를 남겨줘.
코드는 수정하지 말고, PR을 읽고 검증한 뒤 `[리뷰어]` 태그가 붙은 코멘트를 남겨줘.

우선순위:
1. 범위 일탈
2. 서버/클라이언트 경계 위반
3. DB/결제/비밀정보 노출 위험
4. 공통 셸과 디자인 정합성
5. 회귀 리스크
```
