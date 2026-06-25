# 관리 화면

> 카테고리·결제수단·내보내기를 한곳에서. 요약에서 진입([`navigation.md`](./navigation.md)).

## 목적

분류 라벨과 결제수단을 정리하고, 데이터를 내보내 백업한다.

## 구성

- **카테고리** — 추가·수정·삭제(규칙은 [`service-specs/categories.md`](../service-specs/categories.md)).
- **결제수단** — 추가·아카이브·삭제. 종류는 생성 후 고정(규칙은 [`service-specs/payment-methods.md`](../service-specs/payment-methods.md)).
- **내보내기** — 한 번의 동작으로 전체 데이터 내려받기(규칙은 [`service-specs/export.md`](../service-specs/export.md)).

## 흐름

- 사용 중 항목의 삭제는 영향 건수를 먼저 보이고 확인한다([`patterns.md`](./patterns.md)).
- 아카이브는 선택 목록에서만 숨기고 관리 목록엔 남긴다.

## 상태

- 삭제·아카이브 결과는 비차단 토스트로 확인한다.
