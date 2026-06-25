# ux-specs

> 제품을 **어떻게 보이고·어떻게 쓰는가** — 화면 구성·인터랙션·상태. 무엇·왜·규칙은 [`service-specs/`](../service-specs/CLAUDE.md), 작업 원칙은 루트 [`CLAUDE.md`](../../CLAUDE.md).

## 소유 경계

- **service-specs** = 도메인·규칙·행위("X하면 Y된다"). **ux-specs** = 화면 배치·흐름·전이·상태 표현·폼팩터 적응.
- 동작·제약은 여기서 다시 쓰지 않고 service-specs로 링크한다(SSOT). 의존 방향은 ux → service-specs 한쪽으로만.
- 비주얼은 **방향만** — 색값·토큰명·컴포넌트 코드는 적지 않는다(루트 §0.9).

## 횡단

| 문서 | 언제 보는가 |
|---|---|
| [`overview.md`](./overview.md) | UX 원칙·폼팩터 전략·접근성·비주얼 방향이 궁금할 때 |
| [`navigation.md`](./navigation.md) | 화면 지도·정보구조·화면 간 이동·기본 랜딩이 궁금할 때 |
| [`patterns.md`](./patterns.md) | 로딩·빈·에러·성공·확인 다이얼로그 등 공통 인터랙션이 궁금할 때 |

## 화면

| 문서 | 언제 보는가 |
|---|---|
| [`login.md`](./login.md) | 가입·로그인·PIN·비밀번호 재설정 화면을 다룰 때 |
| [`account.md`](./account.md) | 계정·보안(비밀번호·PIN·기기·탈퇴) 화면을 다룰 때 |
| [`entry.md`](./entry.md) | 입력 화면(기본 랜딩)을 다룰 때 |
| [`history.md`](./history.md) | 내역(월 단위 리스트·검색·수정/삭제)을 다룰 때 |
| [`summary.md`](./summary.md) | 요약(월간 집계)을 다룰 때 |
| [`recurring.md`](./recurring.md) | 정기 거래 등록·수정과 알림 승인 화면을 다룰 때 |
| [`settings.md`](./settings.md) | 관리(카테고리·결제수단) 화면을 다룰 때 |
