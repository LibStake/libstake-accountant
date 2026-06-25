# 정기 알림 화면

> 도래 회차를 인앱으로 확인·승인/해제. 정기 규칙·모드는 [`service-specs/recurring.md`](../service-specs/recurring.md).

## 목적

알림 승인 모드의 도래 회차를 놓치지 않고 확인한다(자동 추가 모드는 화면 개입 없음).

## 구성

- 대기 중 회차 목록: 등록명·금액·종류·결제일시.
- 각 회차에 **승인 / 해제**.
- 윈도 안에서만 노출된다(노출 규칙은 [`service-specs/recurring.md`](../service-specs/recurring.md)).

## 흐름

- 앱 진입 시 밀린 회차가 채워지며 대기 목록이 갱신된다(재조정 시점은 [`service-specs/recurring.md`](../service-specs/recurring.md)).
- 승인 → 내역에 거래로 추가([`history.md`](./history.md)). 해제 → 그 회차만 건너뜀.
- 미응답 회차의 만료 처리는 등록 시 정한 옵션을 따른다([`service-specs/recurring.md`](../service-specs/recurring.md)).

## 상태

- 대기 회차가 없으면 노출하지 않는다(비차단).
