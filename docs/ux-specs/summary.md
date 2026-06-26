# 요약 화면

> 월간 집계 회고. 집계 정의는 [`service-specs/transactions.md`](../service-specs/transactions.md).

## 목적

월말에 이 화면만 봐도 한 달 지출 패턴이 보인다(성공 지표는 [`service-specs/overview.md`](../service-specs/overview.md)).

## 구성

- 상단: 그 달 총지출·총수입(요점 먼저).
- 카테고리별 합계 — 큰 순으로.
- 월 선택(기본=이번 달).

## 흐름

- 월 이동으로 다른 달을 회고.

## 폼팩터

- 데스크탑: 총액·카테고리별을 넓게 펼쳐 비교.
- 모바일: 총액부터, 카테고리별은 접거나 스크롤.
