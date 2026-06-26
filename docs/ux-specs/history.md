# 내역 화면

> 월 단위 거래 리스트와 개별 수정/삭제. 거래 규칙은 [`service-specs/transactions.md`](../service-specs/transactions.md).

## 목적

한 달치 거래를 훑고, 잘못된 건을 고치거나 지운다.

## 구성

- 월 선택(기본=이번 달). 한 번에 한 달치만 본다(무한 스크롤 아님).
- 거래 행: 항목명·금액·카테고리·결제수단·발생일시. 지출/수입을 색으로 구분.
- 정기 거래에서 생성된 건은 출처를 표시([`recurring.md`](./recurring.md)).
- 항목명 검색 + 카테고리·결제수단·종류 필터로 좁힌다. 정렬은 최신 우선(규칙은 [`service-specs/transactions.md`](../service-specs/transactions.md)).

## 흐름

- 행 선택 → 수정 또는 삭제.
- 영구 삭제는 확인 다이얼로그를 거친다([`patterns.md`](./patterns.md)).
- 월 이동으로 다른 달을 조회.

## 상태

- 그 달에 거래가 없으면 빈 상태로 입력을 유도한다([`entry.md`](./entry.md)).
