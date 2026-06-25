# 정기 거래 화면

> 정기 거래 등록·수정·삭제와 도래 회차 승인/해제. 규칙·모드는 [`service-specs/recurring.md`](../service-specs/recurring.md).

## 목적

반복 지출/수입을 등록해두고, 도래한 회차를 자동 또는 인앱 확인으로 처리한다.

## 구성

- **등록·수정·삭제** — 등록명·종류·카테고리·금액·결제수단·반복 주기·결제일시·처리 모드.
- **대기 회차 목록** — 알림 승인 모드의 도래 회차: 등록명·금액·종류·결제일시. 각 회차에 **승인 / 해제**.
- 자동 추가 모드는 화면 개입 없이 내역에 쌓인다.

## 흐름

- 앱 진입 시 밀린 회차가 채워지며 대기 목록이 갱신된다(재조정 시점은 [`service-specs/recurring.md`](../service-specs/recurring.md)).
- 승인 → 내역에 거래로 추가([`history.md`](./history.md)). 해제 → 그 회차만 건너뜀.
- 미응답 회차의 만료 처리는 등록 시 정한 옵션을 따른다([`service-specs/recurring.md`](../service-specs/recurring.md)).
- **수정 시**: 이미 생성된 거래는 그대로 두고, 대기 회차에 반영할지는 확인 다이얼로그로 정한다([`patterns.md`](./patterns.md), 규칙은 [`service-specs/recurring.md`](../service-specs/recurring.md)).

## 디스커버리

- 푸시가 없으므로 대기 회차가 있으면 주 내비게이션에 **배지(건수)**로 알린다([`navigation.md`](./navigation.md)).

## 상태

- 대기 회차가 없으면 알림 영역을 노출하지 않는다(비차단).
