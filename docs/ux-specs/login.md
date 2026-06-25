# 로그인 · PIN 키패드

> 인증 게이트 화면. 인증 규칙·자격 판정은 [`service-specs/auth.md`](../service-specs/auth.md).

## 목적

접속자를 인증해 본인 가계부로 들여보낸다. 자주 들어오는 사용자는 PIN으로 빠르게.

## 구성

- **풀 로그인** — 이메일·비밀번호 입력. 처음이거나 빠른 자격이 없을 때.
- **PIN 키패드** — 빠른 자격이 있는 브라우저에 뜨는 숫자 키패드.
- PIN 화면에는 항상 **"일반 로그인으로"** 전환이 있다.

## 흐름

- 진입 → 빠른 자격이 있으면 PIN 키패드, 없으면 풀 로그인(판정은 [`service-specs/auth.md`](../service-specs/auth.md)).
- PIN 연속 실패가 한도를 넘으면 풀 로그인으로 강제 전환된다(한도는 [`service-specs/auth.md`](../service-specs/auth.md)).
- 통과 후 기본 랜딩(입력)으로([`navigation.md`](./navigation.md)).

## 상태

- 인증 실패는 입력값(이메일)을 보존하고 사유를 표시한다([`patterns.md`](./patterns.md)).
- PIN 오입력은 즉시 피드백하되 남은 시도를 과하게 노출하지 않는다.
