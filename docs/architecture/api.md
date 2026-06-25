# 서버 인터페이스 · 데이터 접근 경계

> 클라이언트와 Firestore 사이의 유일한 통로. 도메인 규칙은 [`../service-specs/`](../service-specs/CLAUDE.md).

## 경계 원칙

- 데이터 접근은 **서버에서만**. 클라이언트는 Next.js 서버 경계(라우트 핸들러·서버 액션)로만 읽고 쓴다([`overview.md`](./overview.md)).
- 모든 진입점은 세션 인증 → 사용자 스코프 결정 → 처리의 순서를 공유한다([`auth.md`](./auth.md)).

## 검증

- 입력은 경계에서 검증한다 — 금액 정수·필수값 등 도메인 규칙 위반은 처리 전에 거른다([`../service-specs/transactions.md`](../service-specs/transactions.md)).
- 검증 실패는 입력값을 보존할 수 있게 사유를 담아 돌려준다([`../ux-specs/patterns.md`](../ux-specs/patterns.md)).

## 에러 규약

- 성공/실패를 일관된 형태로 돌려준다. 클라이언트는 이를 비차단 안내·필드 오류로 표현한다([`../ux-specs/patterns.md`](../ux-specs/patterns.md)).
- 인증·존재 여부는 계정을 노출하지 않는 선에서 응답한다([`../ux-specs/login.md`](../ux-specs/login.md)).

## 일관성

- 여러 문서를 함께 바꾸는 작업(회차+거래 생성, 참조 정리 삭제)은 원자적 쓰기로 묶는다([`data-model.md`](./data-model.md)).
