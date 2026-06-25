# 내비게이션 · 정보구조

> 화면이 무엇이 있고 어떻게 오가는가. 화면별 상세는 카탈로그 [`CLAUDE.md`](./CLAUDE.md).

## 화면 지도

- **로그인/PIN**([`login.md`](./login.md)) — 인증 게이트. 통과해야 나머지에 진입.
- **입력**([`entry.md`](./entry.md)) — 인증 후 기본 랜딩. 즉시 기록.
- **내역**([`history.md`](./history.md)) — 월 단위 거래 리스트·수정/삭제.
- **요약**([`summary.md`](./summary.md)) — 월간 집계. 관리 진입점.
- **정기 알림**([`recurring.md`](./recurring.md)) — 도래 회차 승인/해제.
- **관리**([`settings.md`](./settings.md)) — 카테고리·결제수단·내보내기.

## 기본 랜딩

인증 통과 후 첫 화면은 **입력**이다 — 가장 잦은 작업이 즉시 입력이므로(성공 지표는 [`service-specs/overview.md`](../service-specs/overview.md)).

## 주 내비게이션

- 상시 전환 축: **입력 · 내역 · 요약**(모바일=하단 탭, 데스크탑=상단/측면).
- 요약 → 관리로 진입.
- 정기 알림은 대기 회차가 있을 때 노출되어 진입(노출 규칙은 [`service-specs/recurring.md`](../service-specs/recurring.md)).
- 인증 만료 시 어느 화면에서든 로그인/PIN으로 되돌아간다([`login.md`](./login.md)).
