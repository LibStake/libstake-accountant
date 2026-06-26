# 내비게이션 · 정보구조

> 화면이 무엇이 있고 어떻게 오가는가. 화면별 상세는 카탈로그 [`CLAUDE.md`](./CLAUDE.md).

## 화면 지도

- **인증**([`login.md`](./login.md)) — 가입·로그인·PIN·재설정 게이트. 통과해야 나머지에 진입.
- **입력**([`entry.md`](./entry.md)) — 인증 후 기본 랜딩. 즉시 기록.
- **내역**([`history.md`](./history.md)) — 월 단위 거래 리스트·검색·수정/삭제.
- **요약**([`summary.md`](./summary.md)) — 월간 집계.
- **정기 거래**([`recurring.md`](./recurring.md)) — 등록·수정과 도래 회차 승인/해제.
- **관리**([`settings.md`](./settings.md)) — 카테고리·결제수단. 계정·보안 진입점.
- **계정·보안**([`account.md`](./account.md)) — 로그인 정보·PIN·기기·탈퇴.

## 기본 랜딩

인증 통과 후 첫 화면은 **입력**이다 — 가장 잦은 작업이 즉시 입력이므로(성공 지표는 [`service-specs/overview.md`](../service-specs/overview.md)).

## 주 내비게이션

- 상시 전환 축: **입력 · 내역 · 정기 · 요약 · 관리**(모바일=하단 탭, 데스크탑=상단/측면).
- 관리 → 계정·보안으로 진입.
- 정기 거래는 등록·수정 진입과, 대기 회차가 있을 때의 알림 진입을 겸한다(노출 규칙은 [`service-specs/recurring.md`](../service-specs/recurring.md)).
- 대기 회차가 있으면 주 내비게이션에 **배지(건수)**로 표시한다([`recurring.md`](./recurring.md)).
- 인증 만료 시 어느 화면에서든 로그인/PIN으로 되돌아간다([`login.md`](./login.md)).
