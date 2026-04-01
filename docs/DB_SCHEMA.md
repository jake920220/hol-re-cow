# DB_SCHEMA.md

## Role

이 문서는 홀리카우 MVP의 데이터 모델, 관계, 인덱스, RLS 전제를 정리하는 기준 문서다.
최종 구현은 migration으로 남기며, 이 문서는 phase별 설계 방향을 고정하는 역할을 한다.

## Core principles

1. 모든 스키마 변경은 migration으로 관리한다.
2. 인증 주체는 `auth.users`를 기준으로 하고, 앱 데이터는 별도 public schema 테이블로 분리한다.
3. 인증/프로필/팔로우/게시글/댓글/좋아요는 기본적으로 RLS를 전제로 설계한다.
4. MVP에서는 지금 필요한 엔티티만 만든다. 추천 피드, 알림, 신고, 랭킹은 이후 phase로 미룬다.
5. 읽기 성능을 위해 필요한 인덱스는 초기에 넣되, 카운터 캐시와 과한 비정규화는 근거가 있을 때만 추가한다.

## MVP entities

### 1. `profiles`

`auth.users`와 1:1로 연결되는 공개 프로필 테이블.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK, `auth.users.id` 참조 |
| `handle` | `text` | unique, 공개 식별자 |
| `display_name` | `text` | 화면 표시 이름 |
| `avatar_path` | `text` | Supabase Storage path, nullable |
| `bio` | `text` | nullable |
| `created_at` | `timestamptz` | 기본 생성 시각 |
| `updated_at` | `timestamptz` | 수정 시각 |

기본 인덱스:

- `profiles_handle_key` unique index

### 2. `follows`

팔로우 관계를 저장하는 조인 테이블.

| Column | Type | Notes |
| --- | --- | --- |
| `follower_id` | `uuid` | PK 일부, `profiles.id` 참조 |
| `following_id` | `uuid` | PK 일부, `profiles.id` 참조 |
| `created_at` | `timestamptz` | 팔로우 시각 |

제약/인덱스:

- unique composite: `(follower_id, following_id)`
- check: 자기 자신을 팔로우할 수 없음
- index: `following_id`

### 3. `posts`

피드에 노출되는 공통 게시글 엔티티.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `author_id` | `uuid` | `profiles.id` 참조 |
| `post_type` | `text` | `hand_review` 또는 `free_post` |
| `status` | `text` | MVP 기본값은 `published`, 필요 시 `draft` 허용 |
| `title` | `text` | `free_post`에서 우선 사용, nullable |
| `body` | `text` | 본문 또는 서술형 리뷰 내용 |
| `created_at` | `timestamptz` | 생성 시각 |
| `updated_at` | `timestamptz` | 수정 시각 |

기본 인덱스:

- `author_id, created_at desc`
- `post_type, created_at desc`
- `status, created_at desc`

### 4. `hand_reviews`

`post_type = hand_review` 게시글의 구조화된 메타데이터.

| Column | Type | Notes |
| --- | --- | --- |
| `post_id` | `uuid` | PK, `posts.id` 참조, 1:1 |
| `game_type` | `text` | cash / tournament 등 |
| `stakes_label` | `text` | 예: `1/2`, `NL50`, nullable |
| `hero_position` | `text` | UTG, BTN 등 |
| `hero_cards` | `text[]` | 기본적으로 2장 |
| `board_flop` | `text[]` | 최대 3장, nullable |
| `board_turn` | `text` | nullable |
| `board_river` | `text` | nullable |
| `action_summary` | `text` | 액션 요약 또는 스트리트별 서술 |
| `question` | `text` | 리뷰 요청 질문 |
| `result_summary` | `text` | 결과 요약, nullable |

기본 인덱스:

- `post_id` unique
- `game_type`

### 5. `comments`

게시글 댓글. MVP는 flat comment를 기본으로 하되, 추후 확장을 위해 부모 댓글 컬럼을 허용한다.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `post_id` | `uuid` | `posts.id` 참조 |
| `author_id` | `uuid` | `profiles.id` 참조 |
| `parent_comment_id` | `uuid` | nullable, 같은 테이블 참조 |
| `body` | `text` | 댓글 본문 |
| `created_at` | `timestamptz` | 생성 시각 |
| `updated_at` | `timestamptz` | 수정 시각 |

기본 인덱스:

- `post_id, created_at asc`
- `author_id, created_at desc`
- `parent_comment_id`

### 6. `post_likes`

좋아요 관계 테이블.

| Column | Type | Notes |
| --- | --- | --- |
| `post_id` | `uuid` | PK 일부, `posts.id` 참조 |
| `user_id` | `uuid` | PK 일부, `profiles.id` 참조 |
| `created_at` | `timestamptz` | 좋아요 시각 |

제약/인덱스:

- unique composite: `(post_id, user_id)`
- index: `user_id, created_at desc`

## Relationships

- `auth.users 1:1 profiles`
- `profiles 1:N posts`
- `posts 1:0..1 hand_reviews`
- `posts 1:N comments`
- `posts 1:N post_likes`
- `profiles N:M profiles` through `follows`

## Feed query contract

MVP 기본 피드는 아래 조건을 만족하는 게시글 집합이다.

- 작성자가 나 자신이거나
- 작성자가 내가 팔로우한 유저이고
- `posts.status = published`

정렬 기준:

- `posts.created_at desc`

핸드리뷰와 자유게시글은 같은 피드 안에서 섞여도 되지만, 카드 표현은 `post_type`으로 구분 가능해야 한다.

## RLS principles

### `profiles`

- 공개 조회는 허용하되, 수정은 본인만 가능
- 민감 정보는 `auth.users` 또는 별도 비공개 영역에 둔다

### `follows`

- 조회는 허용 가능
- 생성/삭제는 `follower_id = auth.uid()`인 경우만 허용

### `posts`

- `published` 게시글 조회는 허용 가능
- 생성은 인증 사용자만 가능
- 수정/삭제는 `author_id = auth.uid()`인 경우만 허용

### `hand_reviews`

- 부모 `posts` 접근 정책을 따른다
- 생성/수정/삭제는 부모 게시글 작성자만 가능

### `comments`

- 읽을 수 있는 게시글의 댓글만 조회 가능
- 생성은 인증 사용자만 가능
- 수정/삭제는 댓글 작성자만 가능

### `post_likes`

- 조회는 허용 가능
- 생성/삭제는 `user_id = auth.uid()`인 경우만 허용

## Storage assumptions

- `avatars` bucket: 프로필 이미지
- 게시글 첨부 이미지/파일은 실제 요구가 확정되기 전까지 스키마와 bucket을 미리 만들지 않는다

## Migration rules

- enum 또는 check constraint는 migration에 명시한다
- FK, unique index, composite index는 애플리케이션 코드가 아니라 DB 레벨에서 강제한다
- 기존 데이터 backfill이 필요한 변경은 migration 또는 별도 backfill 스크립트로 분리한다
- 운영 데이터 수정이 필요한 경우 무조건 reversible plan을 먼저 만든다

## Phase expansion guide

### Phase 01-02

- `profiles`
- `follows`
- `posts` 기본 구조

### Phase 03

- `posts` 작성 흐름
- `free_post` 중심 입력/검증

### Phase 04

- `hand_reviews`
- `comments`
- `post_likes`

### Later

- 신고/차단
- 북마크
- 알림
- 추천 피드
- 통계 캐시/랭킹
