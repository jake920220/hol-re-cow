# DESIGN.md

## 1. Document role

이 문서는 홀리카우 모바일 웹 MVP에서 Figma를 코드로 옮길 때 사용하는 구현 계약서다.

- 최종 source of truth: Figma의 실제 frame / component / variant
- 해석 보조: 이 문서와 다른 `docs/*.md`
- 구현 기본값: 기존 코드 패턴, 라이브러리 기본값

충돌 시 우선순위는 아래와 같다.

1. Figma
2. `docs/DESIGN.md`
3. 기타 `docs/*.md`
4. 기존 코드 패턴
5. 라이브러리 기본값

Figma가 없거나 frame 범위가 지정되지 않았다면 UI 작업을 진행하지 않는다.
이 문서는 Figma를 대체하지 않으며, Figma에서 읽기 어려운 토큰, 상태, 구조를 저장소 관점에서 고정하는 역할만 한다.

## 2. Product direction

Creative North Star는 **The Private Lounge**다.

- 캐주얼 도박 앱의 네온, 과장된 분위기보다 조용하고 신뢰감 있는 하이엔드 포커 살롱의 밀도를 목표로 한다.
- 홀덤 핸드 리뷰는 오락 UI가 아니라 기록과 분석이 중심인 에디토리얼 경험으로 다룬다.
- 화면은 바쁜 정보판이 아니라 정돈된 리뷰 데스크처럼 느껴져야 한다.
- 다크 프리미엄 톤을 유지하되, 가독성과 상태 식별성은 항상 우선한다.
- stitch 산출물의 개별 화면 편차보다 앱 전체의 일관성을 우선한다.

## 3. App shell contract

### Shared app shell

로그인, 회원가입 화면을 제외한 MVP 주요 화면은 하나의 공통 앱 셸을 사용한다.

- 공통 상단 헤더
- 공통 하단 탭
- 공통 좌우 여백 체계
- 공통 화면 배경과 safe area 처리

### Auth exception

`auth` 화면군은 앱 진입 전 단계이므로 공통 하단 탭을 사용하지 않는다.
상단 영역도 피드형 헤더를 재사용하지 않고 인증 전용 레이아웃으로 분리한다.

### Bottom tab rules

- MVP 기본 탭은 `피드 / 게시글 생성 / 마이페이지`다.
- 하단 탭은 주요 화면에서 항상 같은 위치, 높이, 아이콘 크기, 레이블 배치를 유지한다.
- 활성 탭은 색상과 무게가 즉시 구분되어야 하며, 비활성 탭과 동일한 강조도를 가지면 안 된다.
- create 탭이 Figma에서 강조 variant를 가지더라도, 구현에서는 하나의 공통 bottom navigation component 안에서 variant로 처리한다.

### Top header rules

- 피드, 게시글 작성, 상세, 마이페이지는 상단 헤더 높이와 좌우 패딩 체계를 통일한다.
- 제목 정렬 방식이 화면마다 달라 보여도, 특별한 Figma 의도가 없으면 공통 헤더 variant로 수렴시킨다.
- 뒤로가기, 프로필 진입, 보조 액션은 아이콘 hit area 기준을 통일한다.

## 4. Mobile layout contract

### Primary viewports

- 기본 검증: `375 / 390 / 430`
- 추가 sanity check: `768 / 1280`

### Safe area and device rules

- 상단 헤더, 하단 탭, 바텀시트는 iPhone notch / home indicator safe area를 침범하지 않는다.
- 하단 탭과 주요 CTA는 safe area inset을 포함해 눌림 영역을 유지한다.
- 스크롤 컨테이너 내부 마지막 아이템은 하단 탭과 겹치지 않도록 별도 여백을 둔다.

### Density rules

- 모바일 첫 화면에서 같은 시각적 무게의 카드, 섹션을 3개 이상 동시에 경쟁시키지 않는다.
- 피드, 리스트는 구분선 대신 톤 차이와 간격으로 레이어를 나눈다.
- 중요한 판단 요소는 한 화면에 하나의 주 시선 축만 갖는다.
- 터치 타겟은 가급적 `44x44px` 이상을 유지한다.

## 5. Typography contract

MVP는 **`Noto Sans KR` 단일 폰트 체계**로 통일한다.

- 제목, 본문, 라벨, 버튼, 입력, 탭, 메타 텍스트 모두 `Noto Sans KR`를 기본으로 사용한다.
- 영문 중심 stitch 산출물에서 사용된 Serif, Manrope 계열 표현은 MVP 기준으로 제거한다.
- 한글 가독성, 줄바꿈 안정성, 화면 간 일관성을 시각적 개성보다 우선한다.

### Typography roles

| Level | Font | Use |
| --- | --- | --- |
| `display` | `Noto Sans KR` | 큰 섹션 선언, 빈 상태 헤드라인 |
| `headline` | `Noto Sans KR` | 화면 제목, 카드 제목, 프로필 주요 정보 |
| `title` | `Noto Sans KR` | 서브섹션 제목, 요약 블록, 탭 레이블 |
| `body` | `Noto Sans KR` | 일반 본문, 게시글 내용, 설명 문장 |
| `label` | `Noto Sans KR` | 칩, 메타 정보, 시간, 수치 레이블 |

### Korean readability rules

- 기본 본문은 한국어 줄바꿈이 어색하지 않도록 line-height를 충분히 확보한다.
- 버튼과 탭의 레이블은 영문 폭 기준이 아니라 한글 폭 기준으로 재정렬한다.
- 숫자, 스택, 팟 오즈, VPIP 등 수치 정보도 폰트를 나누지 않고 같은 체계 안에서 weight와 size로 구분한다.

## 6. Token contract

정확한 수치는 Figma 값을 우선한다. Figma에 토큰 이름만 있고 값이 불명확할 때는 아래 역할표를 기준으로 맵핑한다.

### 6.1 Color roles

| Token | Default / rule | Usage |
| --- | --- | --- |
| `surface` | `#131313` | 앱의 기본 배경 |
| `surface_container_lowest` | `#0e0e0e` | recessed 영역, 입력 트랙, 보조 패널 |
| `surface_container_low` | Figma 우선 | 통계 요약, 비활성 카드, 중간 레이어 |
| `surface_container_high` | `#2a2a2a` | 활성 카드, 인터랙티브 모듈 |
| `surface_bright` | `#393939` | 가장 위 레이어, hover, 선택 강조 |
| `primary` | `#95d4b3` | 주요 CTA, 활성 상태의 중심색 |
| `primary_container` | `#00452e` | CTA 그라디언트 외곽, 깊이감 부여 |
| `tertiary` | Figma gold accent 우선 | 승리, 활성 플레이어, 핵심 하이라이트 |
| `outline_variant` | `#414844` at low opacity | 접근성 보조 stroke가 꼭 필요할 때만 사용 |
| `on_surface` | `#e5e2e1` | 기본 본문 텍스트 |
| `on_surface_variant` | Figma 우선 | 보조 텍스트, 메타데이터 |

### 6.2 Spacing roles

아래 스케일은 Figma 토큰이 직접 없는 경우에만 fallback으로 사용한다.

| Token | Value | Use |
| --- | --- | --- |
| `space-1` | `4px` | 미세 보정, 아이콘과 텍스트 미세 간격 |
| `space-2` | `8px` | 라벨, 보조 요소 간격 |
| `space-3` | `12px` | 리스트 내부 작은 간격, 칩 간격 |
| `space-4` | `16px` | 카드 패딩, 기본 콘텐츠 간격 |
| `space-5` | `20px` | 모바일 화면 좌우 여백 기본값 |
| `space-6` | `24px` | 섹션 내부 그룹 간격 |
| `space-8` | `32px` | 큰 카드, 섹션 분리 |
| `space-10` | `40px` | 섹션 헤더 전후, hero 여백 |

### 6.3 Radius roles

| Token | Value | Use |
| --- | --- | --- |
| `radius-sm` | `8px` | 작은 보조 요소 |
| `radius-md` | `12px` | 버튼, 입력 필드, 중간 카드 |
| `radius-lg` | `16px` | 주요 카드, 피드 셀 |
| `radius-xl` | `20px` | 모달, 바텀시트, 큰 오버레이 |
| `radius-full` | `9999px` | 칩, pill, 원형 요소 |

## 7. State contract

모든 인터랙티브 UI는 아래 상태를 기본 세트로 검토한다.

| State | Rule |
| --- | --- |
| `default` | 정보 구조가 가장 먼저 읽혀야 한다. 장식보다 정보 위계 우선 |
| `active` | 선택, 활성은 `primary` 또는 `tertiary` 계열로 즉시 식별 가능해야 한다 |
| `pressed` | 과한 바운스 없이 짧은 scale, tone shift 수준에서 반응한다 |
| `disabled` | 단순 opacity 감소만 쓰지 말고 상호작용 불가가 색, 대비, 의미로 드러나야 한다 |
| `loading` | 레이아웃 점프 없이 skeleton 또는 고정 높이 placeholder를 우선한다 |
| `empty` | 빈 상태는 정보성 문구와 다음 행동 제안을 함께 제공한다 |
| `error` | 오류 메시지는 필드, 영역과 가까운 곳에서 보여주고 재시도 동선을 남긴다 |

상태가 Figma에 모두 그려져 있지 않아도 `loading / empty / error / disabled`는 구현 검토 대상에서 생략하지 않는다.

## 8. Component contract

### Buttons

- Primary button은 `primary` 기반 강조를 사용한다.
- 가능하면 중심이 밝고 외곽이 더 깊은 그라디언트 또는 inner glow를 사용한다.
- Secondary button은 surface 계열 배경 위에 강조 텍스트를 올리는 방식으로 처리한다.
- 라이브러리 기본 border button을 그대로 쓰지 않는다.

### Chips

- 액션, 필터 칩은 `radius-full`을 사용한다.
- inactive는 surface 계열, active는 Figma 기준 accent 계열을 사용한다.
- 칩은 과도한 그림자보다 레이어 차이로 분리한다.

### Cards and lists

- 리스트 분리는 `1px divider` 대신 간격과 배경 레이어 차이로 해결한다.
- Hand card는 외부 카드와 내부 정보 블록이 최소 2단 레이어를 가져야 한다.
- 같은 레벨 카드끼리는 높이와 패딩 체계를 통일한다.

### Inputs

- 입력 필드는 박스보다 세팅된 홈처럼 보이도록 surface low 계열을 우선한다.
- focus는 전체 테두리보다 하단 강조선 또는 얇은 glow가 더 우선이다.
- 오류 상태는 색상만 바꾸지 말고 메시지와 연결해 읽히게 한다.

### Overlay, modal, bottom sheet

- floating UI는 dark surface 위에 반투명 오버레이와 부드러운 blur를 허용한다.
- 바텀시트는 모바일 safe area를 포함해 닫기, 확인 CTA가 가려지지 않아야 한다.
- 시트 내부 콘텐츠는 첫 스크롤 진입에서 핵심 action이 바로 보여야 한다.

### Hand narrative

- hand review의 액션 흐름은 단순 표보다 이야기 흐름이 읽히는 구조를 우선한다.
- dealer, action, pot 변화는 시간축 또는 street 축이 유지되어야 한다.
- 올인, 쇼다운, 승패 확정 같은 큰 이벤트는 크기보다 배치와 대비로 강조한다.

## 9. MVP screen rules

### Auth

- 로그인, 회원가입 화면은 입력, 소셜 로그인, 보조 안내를 명확히 분리한다.
- Google, Kakao, 이메일 동선은 서로 시각적 우선순위가 충돌하지 않아야 한다.
- 오류, 검증 메시지는 입력 근처에 붙인다.
- 공통 앱 셸 바깥의 독립 레이아웃으로 처리한다.

### Feed

- 기본 피드는 `내 게시글 + 팔로우한 유저 게시글`, 정렬은 최신순 기준으로 설계한다.
- hand review 카드와 free post 카드는 같은 피드 문법 안에서 구분 가능해야 한다.
- empty feed는 팔로우 없음과 게시글 없음 문맥이 구분되어야 한다.
- feed 상단 헤더와 하단 탭은 공통 셸 variant를 사용한다.

### Post create

- post type 선택은 `hand_review / free_post`가 즉시 드러나야 한다.
- hand review 작성은 구조화 입력과 자유 서술 영역이 함께 존재해도 위계가 무너지지 않아야 한다.
- 초안, 제출 가능, 불가 상태는 CTA에서 즉시 읽혀야 한다.
- 선택 모달, 일반 글 작성, 핸드리뷰 작성은 모두 공통 셸 위에서 동작하는 작성 흐름으로 묶는다.

### My page

- 프로필 헤더, 팔로워, 팔로잉, 내 게시글 목록은 우선순위가 명확해야 한다.
- 내 프로필 수정 동선은 읽기 화면과 편집 화면을 혼동시키지 않아야 한다.
- 빈 목록과 비공개, 준비중 상태는 별도 메시지로 구분한다.

### Hand review detail

- 핸드의 핵심 맥락은 최소 `게임 정보 / 내 포지션 / 홀카드 / 보드 / 액션 흐름 / 질문`이 읽혀야 한다.
- 수치, 카드, 텍스트 서술이 한 화면에서 경쟁하지 않도록 street 단위 또는 요약 블록 단위로 정리한다.
- 리뷰 포인트와 결과 요약은 눈에 띄되 과장된 도박 UI처럼 보이지 않게 한다.

### Free post

- 자유 게시글은 hand review보다 텍스트 읽기 흐름이 우선이다.
- 제목, 본문, 메타, 반응 영역의 위계를 단순하게 유지한다.
- 같은 피드 안에서 보여도 hand review 카드와 목적이 다르다는 점이 읽혀야 한다.

## 10. Allowed and forbidden patterns

### Allowed

- 레이어 중첩
- 어두운 surface 위의 절제된 accent 사용
- 얇고 긴 easing 기반 모션
- 비대칭 레이아웃이더라도 Figma 범위 안의 의도적 불균형
- 공통 셸 component의 variant 기반 상태 차이

### Forbidden

- `1px` 실선 divider 남발
- 라이브러리 기본 버튼, 탭, 입력 스타일 무비판적 사용
- 순수 흰색 텍스트와 순수 검은 그림자
- 과한 bounce, neon, casino 게임풍 효과
- Figma에 없는 임의 색상, spacing, radius, typography 추가
- 화면마다 다른 bottom navigation 구현
- 영문 폭 기준을 그대로 유지한 한글 레이아웃

## 11. Implementation notes

- Figma와 이 문서가 다르면 Figma를 따른다.
- 이 문서에 없는 숫자나 상태는 임의로 채우지 말고 Figma에서 확인한다.
- Figma가 불명확한 경우에만 이 문서의 fallback 토큰을 사용하고, 사용 사실을 작업 보고에 남긴다.
- 구현 완료 후 최소 `375 / 390 / 430`에서 시각 검증을 수행한다.
- stitch 산출물을 사용할 경우에도 최종 산출물은 공통 셸과 Noto Sans KR 기준으로 다시 정렬한다.
