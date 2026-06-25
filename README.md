# 가계부 — 운영 런북

결제 직후 10초 안에 기록하는 가계부 웹앱. **Next.js(Vercel) + Firestore.**
제품·설계 문서는 [`docs/`](./docs/CLAUDE.md), 작업 원칙은 [`CLAUDE.md`](./CLAUDE.md).

이 문서는 **개발·배포·설정 변경 절차**만 다룬다.

---

## 배포 대상은 둘로 나뉜다

| 대상 | 무엇 | 어디로 | 반영 방법 |
|---|---|---|---|
| **앱** | Next.js 코드 | Vercel | `git push` → **자동** 재배포 |
| **DB 설정** | Firestore 규칙·인덱스 | Firebase | `pnpm fb:deploy` → **수동** |

> ⚠️ `firestore.rules` / `firestore.indexes.json`은 **git push로 반영되지 않는다.** 반드시 `pnpm fb:deploy`로 따로 올려야 실제 Firestore에 적용된다. (git 커밋은 이력 보관일 뿐)

---

## 사전 준비 (최초 1회)

```bash
# 1. 의존성
pnpm install

# 2. 환경변수 — .env.local 을 만들고 .env.default 의 키들을 채운다
cp .env.default .env.local      # 그리고 값 채우기

# 3. Firebase CLI (DB 설정 배포용)
npm i -g firebase-tools
firebase login                  # 로컬 배포는 이 로그인이면 충분 (토큰 불필요)
```

환경변수 키 목록·의미는 [`.env.default`](./.env.default)가 권위. 용도별 구분:

| 키 | Vercel 런타임 | CLI 배포 |
|---|:---:|:---:|
| `FIREBASE_SERVICE_ACCOUNT` · `JWT_SECRET` · `PASSWORD_PEPPER` · `PIN_PEPPER` | ✅ 필요 | — |
| `FIREBASE_TOKEN` | — | 규칙·인덱스 배포(CI)용 |

---

## 로컬 개발

```bash
pnpm dev          # 개발 서버
pnpm build        # 프로덕션 빌드 (타입 검사 포함)
pnpm typecheck    # 타입만 검사
pnpm lint         # 린트
```

---

## 배포

### 앱 (Vercel)

- **기본**: master에 `git push` → Vercel이 자동 빌드·배포.
- **수동**(선택): `vercel --prod` (Vercel CLI 로그인 필요).
- **최초 설정**: Vercel에 repo import 후, 위 표의 *런타임* 환경변수를 Production/Preview에 등록.
  - pnpm 네이티브 빌드(`pnpm-workspace.yaml`의 `allowBuilds`)·번들 제외(`next.config.ts`의 `serverExternalPackages`)는 이미 설정돼 있어 그대로 빌드된다.

### DB 설정 (Firestore)

```bash
pnpm fb:deploy            # 규칙 + 인덱스 모두
pnpm fb:deploy:rules      # 규칙만
pnpm fb:deploy:indexes    # 인덱스만
```

---

## 설정 변경 절차

### 보안 규칙 바꿀 때 — `firestore.rules`

현재는 클라이언트 직결 전면 차단(`if false`). 데이터는 서버 Admin 경로로만 접근하므로 보통 손댈 일이 없다.

```bash
# 1) firestore.rules 수정
pnpm fb:deploy:rules     # 2) 실제 적용
git commit -am "..."     # 3) 이력 보관
```

### 인덱스 추가할 때 — `firestore.indexes.json`

현재는 비어 있다(쿼리를 단일 필드 + 메모리 처리로 설계 → 복합 인덱스 불필요). 복합 쿼리를 새로 추가해 Firestore가 인덱스를 요구하면:

```bash
# 1) firestore.indexes.json 에 인덱스 정의 추가
#    (콘솔의 에러 링크로 만든 뒤 `firebase firestore:indexes`로 내려받아도 됨)
pnpm fb:deploy:indexes   # 2) 적용
git commit -am "..."     # 3) 이력 보관
```

### 시크릿 로테이션

1. 새 값 생성 → `.env.local` 갱신, Vercel 환경변수 갱신
2. 앱 재배포(push 또는 `vercel --prod`)

> `PASSWORD_PEPPER`·`PIN_PEPPER`는 기존 해시에 묶여 있다 — 바꾸면 기존 비밀번호·PIN 검증이 깨진다. 함부로 바꾸지 말 것.

---

## 참고

- `firebase deploy`의 `--token` 방식은 deprecated 경고가 뜬다(현재는 동작). 로컬에선 `firebase login`을, CI에선 서비스 계정 키(`GOOGLE_APPLICATION_CREDENTIALS`)로 옮기는 게 권장 방향.
- Firebase는 **Firestore(DB)만** 사용한다. 위 설정 파일들도 그 DB 하나의 운영 설정일 뿐이다.
