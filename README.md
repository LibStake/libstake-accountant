# 가계부 웹앱 — 부트스트랩 / 배포 (수동 작업 체크리스트)

> 사용자가 손으로 해야 하는 작업의 **시간순 체크리스트**.
> 스택·아키텍처·구현 스펙은 [`CLAUDE.md`](./CLAUDE.md), 제품 기획은 [`docs/`](./docs/CLAUDE.md).
> 스택: **Next.js(App Router) + Vercel + Firebase Firestore**. 비용은 Vercel Hobby + Firestore Spark로 월 $0([`CLAUDE.md` §9](./CLAUDE.md)).

## 사전 준비
- Node ≥ 20, pnpm
- 계정: GitHub, [Firebase](https://console.firebase.google.com)(구글), [Vercel](https://vercel.com)

## 1. Firebase 프로젝트 (Spark, 무료)
1. Firebase 콘솔에서 프로젝트 생성(Spark 플랜 — 결제수단 등록 불필요).
2. **Firestore Database** 생성: Native mode, 리전 `asia-northeast3`(서울).
3. 프로젝트 설정 → 서비스 계정 → **새 비공개 키 생성** → JSON 다운로드. (이 JSON이 아래 `FIREBASE_SERVICE_ACCOUNT` 값)
4. Firebase CLI 로그인 후 프로젝트 별칭 연결: `npx firebase login` → `.firebaserc`의 `projects.default`에 프로젝트 ID.

## 2. 자격증명 해시 생성 (단일 사용자)
- 로그인 비밀번호와 퀵 PIN(6자리)을 PBKDF2로 해시: `node scripts/hash-credential.mjs`
- 출력된 해시를 `AUTH_PASSWORD_HASH` / `AUTH_PIN_HASH`로, 로그인 이메일을 `OWNER_EMAIL`로 쓴다. (배경 [`CLAUDE.md` §7.1](./CLAUDE.md))

## 3. 환경변수 주입
`.env.default`를 `.env.local`로 복사한 뒤(로컬, gitignored), 같은 값을 **Vercel 프로젝트 환경변수**에도 넣는다:
- `FIREBASE_SERVICE_ACCOUNT` — 서비스계정 JSON(한 줄). 로컬은 작은따옴표로 감싸고, **Vercel엔 따옴표 없이 JSON 본문만**.
- `OWNER_EMAIL`
- `AUTH_PASSWORD_HASH`
- `AUTH_PIN_HASH`
- (`FIREBASE_TOKEN`은 Firestore 배포용 CI 토큰 — 로컬에만 두고 Vercel엔 불필요.)

## 4. Firestore 규칙·인덱스 배포
- 클라이언트 직접 접근을 막는 규칙과 목록 필터용 복합 인덱스를 배포: `npx firebase deploy --only firestore:rules,firestore:indexes`

## 5. 카테고리 시드 (1회)
- 기본 카테고리를 Admin SDK로 주입: `npx tsx scripts/seed-categories.ts`

## 6. 로컬 구동
- `pnpm install`
- `pnpm dev` → http://localhost:3000 에서 입력/내역/요약 동작 확인.

## 7. Vercel 배포
- Vercel에서 GitHub 레포 import → 3번 환경변수 설정 → 배포.
- 이후 `master` push마다 자동 빌드/배포.

## 8. (선택) 커스텀 도메인
- Route 53에 **서브도메인 CNAME → `cname.vercel-dns.com`** 추가 후, Vercel 도메인 설정에서 그 서브도메인을 등록한다. (NS는 Route 53 유지 — [`CLAUDE.md` §12](./CLAUDE.md) 결정 5)

## 9. PWA 확인
- 모바일 Safari/Chrome에서 "홈 화면에 추가" → standalone으로 열리는지 확인(apple-touch-icon 포함).

## 10. 백업(데이터 내보내기)
- 자동 백업 인프라는 없다. 요약 화면의 **관리 → 데이터 내보내기**로 전체 데이터를 zip(JSON)으로 내려받아 오프-플랫폼(로컬/드라이브)에 보관한다. ([`CLAUDE.md` §8](./CLAUDE.md))
