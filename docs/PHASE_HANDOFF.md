# PHASE_HANDOFF.md

## 목적

이 문서는 홀리카우 프로젝트에서 구현 세션과 리뷰 세션이 phase마다 같은 기준으로 움직이도록 만드는 handoff 가이드다.

- 구현 세션은 `phase/<nn>-<slug>` 브랜치에서 작업한다.
- 리뷰 세션은 `review/<nn>-<slug>` 브랜치와 별도 worktree에서 작업한다.
- 두 세션은 같은 파일을 동시에 live edit 하지 않는다.
- 리뷰 세션은 범위를 넓히지 않고, 작은 수정만 직접 수행한다.

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

예시:

- 브랜치: `review/01-project-shell`
- 폴더: `../wt-holrecow-review-01-project-shell`

### review worktree 생성 예시

```bash
git worktree add -b review/01-project-shell ../wt-holrecow-review-01-project-shell phase/01-project-shell
```

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
4. 이번 phase의 목표와 범위를 다시 적는다.
5. 구현 브랜치 결과를 기준으로 리뷰를 진행한다.

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

## 리뷰 세션의 수정 범위

리뷰 세션이 직접 수정해도 되는 것은 아래만 허용한다.

- 명백한 버그
- 타입 오류
- 빌드 오류
- 작은 UI 정합성 수정
- 보안 경계 위반 수정

아래는 직접 확장하지 않는다.

- phase 범위를 넓히는 기능 추가
- 새 설계 결정이 필요한 큰 구조 변경
- 다음 phase 작업 선반영

범위가 커지면 구현 세션으로 되돌려서 처리한다.

## 리뷰 세션 종료 시 남길 내용

리뷰 세션은 종료 전에 아래를 남긴다.

1. 발견한 문제
2. 직접 수정한 항목
3. 실행한 검증 명령
4. 남은 리스크
5. 구현 세션이 다음으로 할 일

## 구현 세션으로 되돌릴 때

리뷰 세션에서 직접 수정한 경우:

```bash
git switch phase/01-project-shell
git merge --ff-only review/01-project-shell
```

fast-forward가 안 되면 필요한 커밋만 `cherry-pick`한다.

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
phase n 코드리뷰를 진행해줘.

우선순위:
1. 범위 일탈
2. 서버/클라이언트 경계 위반
3. DB/결제/비밀정보 노출 위험
4. 공통 셸과 디자인 정합성
5. 회귀 리스크

review 브랜치에서는 작은 수정만 직접 수행해줘.
```
