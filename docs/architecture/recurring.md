# 정기 거래 재조정 (구현)

> 정기 거래가 거래로 실체화되는 메커니즘. 사용자 규칙·모드는 [`../service-specs/recurring.md`](../service-specs/recurring.md), 화면은 [`../ux-specs/recurring.md`](../ux-specs/recurring.md).

## 트리거

- 외부 스케줄러를 두지 않는다 — 재조정은 **앱 진입 요청** 시 서버에서 실행한다([`../service-specs/recurring.md`](../service-specs/recurring.md) 재조정 시점).
- 마지막 재조정 시점 이후부터 현재(KST)까지의 도래분만 계산해 매 진입 비용을 한정한다.

## 처리

- 각 정기 거래의 주기·결제일시 인코딩으로 도래 회차를 산출한다(말일 클램프 포함, [`../service-specs/recurring.md`](../service-specs/recurring.md)).
- **자동 추가** 모드: 도래 회차를 거래로 실체화한다.
- **알림 승인** 모드: 윈도 안이면 대기 회차로 노출하고, 승인 시 거래로 실체화한다. 윈도 경과 미응답은 정의된 만료 처리를 따른다([`../service-specs/recurring.md`](../service-specs/recurring.md)).

## 멱등성

- 회차는 (정기 거래, 결제일시) 식별자로 유일하다 — 재조정이 중복·동시 실행돼도 회차·거래가 한 번만 생긴다([`data-model.md`](./data-model.md)).
- 회차 상태 전이와 거래 생성은 원자적으로 묶는다.
- 앱을 늦게 열어도 거래는 결제일시 기준으로 채워진다 — 누락이 아니라 지연([`../service-specs/recurring.md`](../service-specs/recurring.md)).
