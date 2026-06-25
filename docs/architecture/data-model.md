# 데이터 모델

> Firestore 문서 구조의 방향. 도메인 정의·규칙은 [`../service-specs/`](../service-specs/CLAUDE.md). 식별자·필드 이름은 코드가 SOT(루트 §0.9).

## 원칙

- **사용자 격리**: 모든 도메인 데이터는 소유 사용자에 종속되고 사용자 경계로 분할된다. 어떤 조회도 인증 스코프를 벗어나지 않는다([`auth.md`](./auth.md)).
- **문서 지향**: 한 번에 읽는 단위로 묶고 과한 정규화를 피한다. 조인 대신 조회 패턴에 맞춘 형태.
- **금액**: 원 단위 정수로만 저장한다(부동소수 금지, [`../service-specs/transactions.md`](../service-specs/transactions.md)).
- **시각**: KST 기준 절대 시각으로 저장한다.

## 집계(도메인)

service-specs의 도메인을 그대로 영속화한다 — 거래, 정기 거래(정의), 도래 회차, 카테고리, 결제수단, 사용자·자격증명, 기기. 각 정의는 해당 스펙이 권위:

- 거래·요약 → [`../service-specs/transactions.md`](../service-specs/transactions.md)
- 정기 거래·회차 → [`../service-specs/recurring.md`](../service-specs/recurring.md)
- 카테고리 → [`../service-specs/categories.md`](../service-specs/categories.md)
- 결제수단 → [`../service-specs/payment-methods.md`](../service-specs/payment-methods.md)
- 사용자·자격증명·기기 → [`../service-specs/auth.md`](../service-specs/auth.md)

## 월간 요약

- 별도 집계 저장 없이 해당 월 거래를 조회해 계산한다 — 한 사용자의 월 거래량은 한정적이므로.
- 조회는 사용자 스코프 + 발생 연-월 + (선택) 분류·결제수단·종류 필터로 좁힌다([`../service-specs/transactions.md`](../service-specs/transactions.md) 조회).

## 멱등 회차

- 도래 회차는 (정기 거래, 결제일시)로 결정되는 식별자를 가진다 — 재조정·자동추가를 여러 번 실행해도 같은 회차가 중복 생성되지 않는다([`recurring.md`](./recurring.md)).
- 회차 상태 전이와 그로부터의 거래 생성은 원자적으로 묶어 부분 생성 불일치를 막는다.

## 참조 정리 · 삭제

- 카테고리·결제수단 삭제 시, 그것을 참조하던 거래·정기 거래의 해당 참조만 비우는 일괄 갱신을 한다(거래는 보존, [`../service-specs/categories.md`](../service-specs/categories.md)·[`../service-specs/payment-methods.md`](../service-specs/payment-methods.md)).
- 거래 삭제는 즉시·영구 — 소프트 삭제 없음([`../service-specs/transactions.md`](../service-specs/transactions.md)).
- 계정 삭제는 그 사용자의 모든 데이터를 제거한다([`../service-specs/auth.md`](../service-specs/auth.md)).
