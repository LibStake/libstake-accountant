# docs

> 코드 전에 관련 문서를 읽고 그에 기반해 작업한다. 작업 원칙은 루트 [`CLAUDE.md`](../CLAUDE.md).

## 카탈로그 규칙

- 모든 폴더는 자신의 카탈로그 `CLAUDE.md`를 둔다 — 그 폴더 문서의 **링크 + 언제 보는지**를 적는다.
- 하위 폴더는 그 폴더의 `CLAUDE.md`로 진입한다(위→아래 cascade).
- **orphan 금지**: 모든 문서는 속한 폴더의 `CLAUDE.md`에 반드시 카탈로그된다. 어디서도 참조되지 않는 문서는 없다.

## 이 폴더

| 문서 | 언제 보는가 |
|---|---|
| [`service-specs/`](./service-specs/CLAUDE.md) | 제품이 무엇을·왜·누구에게? 기능·도메인이 궁금할 때 |
| [`architecture/`](./architecture/CLAUDE.md) | 어떻게 만드는가 — 스택·구조·데이터·API·인증이 궁금할 때 |
