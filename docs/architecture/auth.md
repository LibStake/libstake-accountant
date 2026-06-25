# 인증 · 보안 (구현)

> 인증을 어떻게 구현하는가. 사용자에게 보이는 규칙·흐름은 [`../service-specs/auth.md`](../service-specs/auth.md), 화면은 [`../ux-specs/login.md`](../ux-specs/login.md)·[`../ux-specs/account.md`](../ux-specs/account.md).

## 방식

- **자체 인증**: 이메일·비밀번호·PIN을 직접 다룬다(Firebase Auth 미사용). 자격증명은 서버에서만 처리한다.
- Firebase는 데이터 저장(Firestore)으로만 쓰고, 인증 상태는 자체 세션 토큰으로 관리한다.

## 자격증명 저장

- 비밀번호·PIN은 서버 시크릿(페퍼)을 더해 단방향 해시로 저장한다 — 원문·역산 불가.
- 해싱·검증은 서버 경계 안에서만 일어난다([`api.md`](./api.md)). 시크릿은 환경에서 주입한다([`deployment.md`](./deployment.md)).

## 세션

- 로그인 성공 시 서버가 서명한 세션 토큰을 발급하고, 브라우저에는 접근 불가(httpOnly) 쿠키로 싣는다.
- 모든 요청은 이 토큰으로 사용자 스코프를 확인한 뒤에야 데이터에 닿는다([`api.md`](./api.md)).

## 빠른 잠금해제(PIN)

- 풀 로그인 후 PIN을 설정한 브라우저는 기기 토큰으로 식별된다(유효기간은 [`../service-specs/auth.md`](../service-specs/auth.md)).
- PIN 검증·실패 카운트·잠금 해제는 그 기기에 한해 서버에서 판정한다.
- 비밀번호 변경·재설정·기기 해제는 관련 빠른 로그인 자격을 무효화한다([`../service-specs/auth.md`](../service-specs/auth.md)).

## 가입 · 분실 복구

- 가입은 이메일을 검증하지 않는다 — 이메일은 로그인 식별자로만([`../service-specs/auth.md`](../service-specs/auth.md)).
- 외부 채널을 두지 않으므로 비밀번호 분실 복구는 빠른 로그인(PIN)이 살아 있는 기기에서만 — 그 기기에서 현재 비밀번호 없이 재설정한다([`../service-specs/auth.md`](../service-specs/auth.md)).
- 로그인 응답은 계정 존재 여부를 노출하지 않는다([`../ux-specs/login.md`](../ux-specs/login.md)).

## 격리 · 방어

- Firestore 보안 규칙은 클라이언트 직결을 전면 차단한다 — 데이터는 서버 Admin 경로로만 접근한다.
- 사용자 격리는 서버에서 모든 질의를 인증 스코프로 한정해 강제한다([`data-model.md`](./data-model.md)).
