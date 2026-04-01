---
name: figma-implementation
description: Figma frame/component/variant와 docs/DESIGN.md를 기준으로 홀리카우 모바일 UI를 정확하게 구현하고 검증한다.
---

# Figma Implementation Skill

## Use when

- 화면, 컴포넌트, 섹션, 모달, 바텀시트 등 UI를 새로 구현할 때
- 기존 UI를 Figma와 더 가깝게 맞출 때
- spacing / typography / color / state 정합성을 점검할 때
- 모바일 웹 화면을 구현하거나 수정할 때

## Do not use when

- 순수 백엔드 작업만 하는 경우
- DB migration, API contract, auth callback 처리처럼 UI가 핵심이 아닌 경우
- 요구사항 자체가 아직 정리되지 않은 경우
- Figma source of truth 없이 임의로 새 디자인을 만들어야 하는 경우

## Required inputs

- 대상 Figma frame / component / variant
- `docs/DESIGN.md`
- 현재 phase 목표
- 기존 관련 컴포넌트 경로
- 검증할 뷰포트: `375 / 390 / 430`

## Goal

비슷하게가 아니라 정확하게 구현한다.
라이브러리 기본 UI보다 Figma / `docs/DESIGN.md`를 우선한다.

## Procedure

### 1. Scope 잠그기

- 이번 작업의 화면/컴포넌트 범위를 한 문장으로 정리한다.
- 수정 대상 파일과 영향 파일을 먼저 적는다.
- phase 범위를 넘는 변경은 하지 않는다.
- Figma frame 범위가 없으면 구현을 시작하지 않는다.

### 2. Source of truth 확인

- Figma에서 실제 대상 frame / component / variant를 확인한다.
- `docs/DESIGN.md`에서 관련 토큰과 공통 규칙을 확인한다.
- 충돌 시 `Figma > DESIGN.md > 코드 > 라이브러리 기본값` 순으로 판단한다.

### 3. Token mapping

구현 전에 최소 아래 항목을 표처럼 정리한다.

- spacing
- typography
- color
- radius
- border / outline
- shadow / blur
- icon size
- state: `default / active / pressed / disabled / loading / empty / error`

정해진 토큰이 있으면 그대로 사용한다.
임의 값 추가는 허용하지 않고, 불가피하면 근거와 범위를 작업 로그에 남긴다.

### 4. Component reuse

아래 순서로 재사용을 검토한다.

1. 기존 feature 컴포넌트
2. shared/ui 컴포넌트
3. primitives
4. 부족할 경우에만 신규 컴포넌트

새 컴포넌트를 만들면 아래를 남긴다.

- 기존 것을 재사용하지 않은 이유
- props를 어디까지 제한했는지
- Figma에 존재하는 변형 상태를 어떻게 반영했는지

### 5. Implementation rules

- 모바일 웹 기준으로 먼저 맞춘다.
- Server Component를 기본으로 하고 필요한 곳만 Client Component로 올린다.
- 터치 타겟은 충분히 확보한다.
- 상태별 UI를 누락하지 않는다.
- `loading / empty / error / disabled` 상태를 생략하지 않는다.
- 하단 탭, 바텀시트, 모달은 safe area를 포함해 검증한다.

### 6. Visual verification

최소 아래를 확인한다.

- `375`
- `390`
- `430`

추가 sanity check:

- `768`
- `1280`

확인 항목:

- 시각 계층
- 좌우 여백
- 상하 간격
- 타이포 대비
- 아이콘 정렬
- 버튼 높이/폭
- 스크롤/고정 하단 탭 동작
- 노치/안전영역 문제
- 텍스트 줄바꿈 문제
- 선택/비활성/에러 상태 식별성

### 7. Diff reporting

작업 후 아래를 남긴다.

- Figma 대비 그대로 맞춘 부분
- 불가피하게 다르게 처리한 부분
- 남은 시각 리스크
- 리뷰어가 꼭 봐야 할 화면

## Output

작업 전:

- 대상 화면/컴포넌트
- 참고한 Figma / `docs/DESIGN.md` 항목
- 변경 파일
- 구현 계획

작업 후:

- 구현 요약
- 상태별 검증 결과
- 뷰포트 확인 결과
- 남은 차이점 / 리스크

## Gotchas

- 라이브러리 기본 padding을 그대로 믿지 말 것
- 아이콘/텍스트 baseline 어긋남을 방치하지 말 것
- list cell / tab / chip / input 높이를 제각각 만들지 말 것
- 나중에 정리라는 이유로 임시 스타일을 남기지 말 것
- empty / loading / error 상태를 생략하지 말 것
- Figma 범위가 없는데 무드만 보고 새 디자인을 만들지 말 것
