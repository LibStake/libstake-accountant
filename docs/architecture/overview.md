# 아키텍처 개요

> 무엇으로·어떻게 구성되는가. 제품 요구는 [`../service-specs/`](../service-specs/CLAUDE.md), 화면은 [`../ux-specs/`](../ux-specs/CLAUDE.md), 작업 원칙은 루트 [`CLAUDE.md`](../../CLAUDE.md).

## 스택

- **프론트·서버**: Next.js(App Router) 단일 코드베이스 — UI와 서버 로직을 한곳에서.
- **호스팅**: Vercel — 정적 자산과 서버 함수(라우트 핸들러·서버 액션)를 배포.
- **데이터**: Firestore(관리형 문서 DB) — 서버에서 Admin 권한으로만 접근.
- **인증**: 자체 구현(이메일·비밀번호·PIN), 서명 세션 토큰. Firebase Auth 미사용([`auth.md`](./auth.md)).

## 토폴로지

브라우저 ↔ Next.js 서버(Vercel) ↔ Firestore. **클라이언트는 DB에 직접 접근하지 않는다** — 모든 데이터 접근은 서버 경계를 거친다([`api.md`](./api.md)).

- 자격증명 해싱·토큰 서명·멱등 재조정처럼 신뢰가 필요한 로직은 전부 서버에서.
- Firestore 보안 규칙은 클라이언트 직결을 차단하고 서버 Admin 경로만 허용한다([`auth.md`](./auth.md)).

## 런타임 · 렌더링

- 인증 후 앱 셸은 폼팩터별로 적응한다(전략은 [`../ux-specs/overview.md`](../ux-specs/overview.md)).
- 읽기는 서버에서 사용자 스코프로 가져오고, 쓰기는 서버 경계로 보낸다([`api.md`](./api.md)).
- 오프라인·캐시 동기화는 하지 않는다 — 웹+서버 전제([`../service-specs/overview.md`](../service-specs/overview.md) 범위 밖).

## 요청 흐름

1. 요청은 세션 토큰으로 인증된다(없거나 만료면 인증 게이트, [`auth.md`](./auth.md)).
2. 인증된 사용자 스코프 안에서만 데이터를 읽고 쓴다([`data-model.md`](./data-model.md)).
3. 앱 진입 요청은 밀린 정기 회차를 멱등 재조정한다([`recurring.md`](./recurring.md)).

## 횡단 전제

- 시간대 KST 고정, 통화 KRW 정수(규칙은 [`../service-specs/overview.md`](../service-specs/overview.md), [`../service-specs/transactions.md`](../service-specs/transactions.md)).
- 운영비 최소를 목표로 관리형 서비스의 무료/저비용 구간에 맞춰 설계한다([`../service-specs/overview.md`](../service-specs/overview.md)).
- 호스팅·DB 외 외부 서비스 연동은 두지 않는다 — 이메일 발송 등 없음([`../service-specs/overview.md`](../service-specs/overview.md) 범위 밖).
- 구체 식별자·스키마·키 이름은 코드와 설정이 SOT(루트 §0.9) — 문서는 구조와 방향만.
