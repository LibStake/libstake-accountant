# architecture

> 가계부 서비스를 **어떻게 만드는가** — 스택·구조·데이터·API·인증 등 기술 설계. 무엇·왜는 [`../service-specs/`](../service-specs/CLAUDE.md), 화면은 [`../ux-specs/`](../ux-specs/CLAUDE.md), 작업 원칙은 루트 [`CLAUDE.md`](../../CLAUDE.md).

| 문서 | 언제 보는가 |
|---|---|
| [`overview.md`](./overview.md) | 스택·토폴로지·런타임/렌더링 경계·요청 흐름이 궁금할 때 |
| [`data-model.md`](./data-model.md) | Firestore 데이터 구조·사용자 격리·집계·멱등 회차가 궁금할 때 |
| [`auth.md`](./auth.md) | 인증·세션·시큐리티 룰 등 보안 구현이 궁금할 때 |
| [`api.md`](./api.md) | 서버 인터페이스·데이터 접근 경계·검증/에러 규약이 궁금할 때 |
| [`recurring.md`](./recurring.md) | 정기 거래 재조정(앱 진입 멱등 처리) 구현이 궁금할 때 |
| [`deployment.md`](./deployment.md) | Vercel 배포·환경/시크릿·Firebase 구성이 궁금할 때 |
