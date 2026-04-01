# AGENTS.md

## Project

- Project: 홀리카우 (Holre-cow)
- Product: 홀덤 핸드리뷰 중심 모바일 웹 커뮤니티
- Primary goal: Figma와 DESIGN.md를 기준으로 모바일 웹 MVP를 정확하게 구현한다.
- Future goal: 이후 앱 출시를 막지 않는 구조를 유지한다.

## Source of truth

우선순위는 아래 순서를 따른다.

1. Figma의 실제 frame / component / variant
2. DESIGN.md
3. docs/*.md
4. 기존 코드의 재사용 가능한 패턴
5. 라이브러리 기본값

디자인 충돌 시 라이브러리 기본값보다 Figma / DESIGN.md를 우선한다.

## Always-on rules

1. 이 프로젝트는 디자인을 새로 만드는 작업이 아니라, 정해진 디자인을 정확하게 옮기는 작업이다.
2. 모바일 웹 우선으로 구현한다. 기본 검증 뷰포트는 375 / 390 / 430이다.
3. 임의 색상, 임의 spacing, 임의 radius, 임의 typography를 만들지 않는다.
4. 기존 컴포넌트와 토큰을 먼저 재사용하고, 부족할 때만 새로 만든다.
5. 병렬 작업은 반드시 브랜치 분리 + git worktree로만 수행한다.
6. 같은 파일을 두 세션이 동시에 live edit 하지 않는다.
7. phase 범위를 벗어난 리팩토링은 하지 않는다.
8. DB 스키마 변경은 반드시 migration으로 관리한다.
9. 인증/프로필/팔로우/게시글/댓글/좋아요 관련 데이터는 RLS 전제로 설계한다.
10. 구현 후 lint / typecheck / build / 주요 사용자 플로우 검증을 수행한다.

## Stack assumptions

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase(Postgres/Auth/Storage) 기준으로 설계
- Server Component 기본, 상호작용이 필요할 때만 Client Component 사용

## Mandatory triggers

- UI 작업이면 반드시 `docs/DESIGN.md`와 `skills/figma-implementation/SKILL.md`를 먼저 확인한다.
- 새 phase를 시작하거나 이어서 진행하면 `skills/gsd-phase/SKILL.md`를 따른다.
- 브랜치 / worktree / commit / review 규칙은 `docs/GIT_RULES.md`를 따른다.
- 테이블 구조 / 인덱스 / 관계 / RLS 원칙은 `docs/DB_SCHEMA.md`를 따른다.

## Product scope

### Tabs

- 피드
- 게시글 생성
- 마이페이지

### Auth

- Google 로그인
- Kakao 로그인
- 이메일 회원가입 / 로그인

### Feed

- 기본 피드는 내가 팔로우한 유저 + 내 게시글
- 기본 정렬은 최신순
- MVP에서는 알고리즘 추천 피드 없음

### Post types

- hand_review
- free_post

### My page

- 프로필
- 내 게시글
- 팔로워 / 팔로잉
- 기본 프로필 수정

## Commands

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
