# 가계부 웹앱 — 기획 / 구현 스펙

> 이 문서는 Claude Code에 입력해 작업을 지시하기 위한 스펙이다.
> 목표는 **개인용 가계부 웹앱을 사실상 월 $0(도메인 제외)으로 운영**하면서,
> 백엔드와 사용자 데이터 export(백업 대용)를 갖추는 것이다.

---

## 0. 작업 원칙 (Working principles)

> 일반적인 LLM 코딩 실수를 줄이기 위한 행동 지침. **속도보다 신중함을 우선**한다. 사소한 작업에는 판단력을 발휘.

### 0.1 코딩 전에 생각하기
가정하지 말 것. 혼란을 숨기지 말 것. 절충점을 드러낼 것.

- 가정을 명시적으로 진술한다. 불확실하면 묻는다.
- 해석이 여러 갈래라면 조용히 하나를 고르지 말고 선택지를 제시한다.
- 더 간단한 접근이 있으면 말한다. 타당하면 반박한다.
- 불분명한 점이 있으면 멈춘다. 무엇이 혼란스러운지 짚고 묻는다.

### 0.2 단순함 우선
문제를 푸는 최소한의 코드. 추측성 코드는 없다.

- 요청된 것 이상의 기능을 넣지 않는다.
- 한 번만 쓰는 코드를 추상화하지 않는다.
- 요청되지 않은 "유연성"이나 "확장성"을 만들지 않는다.
- 일어날 수 없는 시나리오에 대한 오류 처리를 넣지 않는다.
- 200줄을 썼는데 50줄로 가능했다면 다시 쓴다.

스스로 묻는다: "시니어 엔지니어가 이걸 보면 과하다고 할까?" 그렇다면 단순화한다.

### 0.3 구조와 원리에 충실하기 (Ad Hoc 지양)
단순함이 곧 임시방편을 뜻하지는 않는다.

- 기존 아키텍처 경계, 레이어, 디자인 패턴, 네이밍/코딩 컨벤션을 따른다.
- 빠른 우회나 땜질 대신, 그 코드가 속한 맥락에 맞는 일관된 방식을 택한다.
- 기존 원리와 충돌하는 요청이라면 조용히 우회하지 말고 그 충돌을 드러낸다.

§0.2와의 균형: 과도한 추상화도, 임시방편도 모두 실패. 목표는 "단순하되 일관된" 코드.

### 0.4 수술적(Surgical) 변경
필요한 것만 건드린다. 내가 만든 흔적만 정리한다.

기존 코드를 편집할 때:
- 인접한 코드·주석·서식을 임의로 "개선"하지 않는다.
- 망가지지 않은 것을 리팩터링하지 않는다.
- 내 방식과 다르더라도 기존 스타일을 따른다.
- 관련 없는 죽은 코드를 발견하면 삭제하지 말고 언급한다.

변경으로 고아 코드가 생길 때:
- 내 변경 때문에 더 이상 쓰이지 않게 된 import/변수/함수는 제거한다.
- 요청받지 않은 기존 죽은 코드는 제거하지 않는다.

기준: 변경된 모든 줄은 사용자의 요청으로 직접 추적될 수 있어야 한다.

### 0.5 목표 중심 실행
성공 기준을 정의한다. 확인될 때까지 반복한다.

작업을 검증 가능한 목표로 바꾼다:
- "유효성 검사 추가" → "잘못된 입력에 대한 테스트를 먼저 작성하고, 통과시킨다"
- "버그 수정" → "버그를 재현하는 테스트를 먼저 작성하고, 통과시킨다"
- "X 리팩터링" → "변경 전후로 테스트가 통과하는지 확인한다"

다단계 작업이라면 간략한 계획을 세운다:
```
1. [단계] → 확인: [체크]
2. [단계] → 확인: [체크]
3. [단계] → 확인: [체크]
```

명확한 성공 기준은 독립적인 반복을 가능하게 한다. 약한 기준("작동하게 만들기")은 끝없는 재확인을 부른다.

### 0.6 작업 전 문서 확인 (docs 이정표)
코드를 건드리기 전에 `docs/`를 먼저 본다.

- 진입점은 [`docs/CLAUDE.md`](./docs/CLAUDE.md) — docs 루트 인덱스.
- `docs/` 각 영역에는 그 영역의 source of truth가 있다(§0.10 문서 맵).
- 절차(process: 커밋·의존성·릴리스 등) 문서는 생성 시 `docs/process/` 아래에 두고, 그 영역 인덱스도 `docs/process/CLAUDE.md`로 둔다(현재 미생성 — 필요 시 작성).
- 문서가 요청·코드와 충돌하면 조용히 우회하지 말고 충돌을 드러낸다(§0.1).

### 0.7 주석·이름은 세션 밖에서도 통해야 한다
미래의 독자는 이 세션에 없었다. 세션에서만 통하는 참조를 남기지 않는다.

- 세션 안에서만 의미를 갖는 라벨을 남기지 않는다. 예: `(req2)`, "위에서 정한 대로", "요청 3번".
- 결정의 근거가 정말 필요하면, 세션 라벨로 가리키지 말고 근거 자체를 자기완결적인 문장으로 풀어 쓴다. 근거가 불필요하면 아예 적지 않는다.
    - 나쁨: `Marker base for aggregate roots (req2).`
    - 좋음: `Marker base for aggregate roots.`
- 외부의 **영속적** 식별자(이슈·티켓·PR 번호, 안정적 URL 등)는 괜찮다. 채팅의 임시 번호도, **세션에만 보이는 로컬 경로**(add-dir 등)도 영속 식별자가 아니다.
- **세션 한정 환경 참조 금지.** 레포에 실리는 문서·주석은 그 레포 안에서 해소되는 참조만 둔다. 다른 레포의 파일을 본떠야 한다면 경로로 가리키지 말고 본뜰 내용을 자기완결적으로 풀어 쓴다.

기준: 주석·이름·문서에서 세션 흔적을 들어내도 뜻이 온전한가?

### 0.8 부수효과(side-effect)는 `! -`로 병기
함수가 일으키는, 호출자가 예상하지 못할 동작은 눈에 띄게 경고한다.

- side-effect 설명은 주석에 `! - <설명>` 형식으로 별도 줄에 둔다. 일반 설명과 섞지 않는다.
- 예:
```
/**
 * Reserves stock for the given order.
 *
 * ! - Also decrements the cached availability counter; a read right after
 *     this call sees the lowered value.
 */
```

기준: 함수의 겉으로 드러나지 않는 부수효과가 `! -`로 한눈에 띄는가?

### 0.9 문서 작성 규칙
문서도 코드처럼 단일 출처·자기완결·일반화를 따른다.

- **단일 출처(SSOT)**: 같은 내용을 여러 문서에 분산하지 않는다. 한 문서를 권위로 정하고, 나머지는 해당 섹션 링크(`[제목](path#섹션)`)로만 가리킨다. 요약을 옮기더라도 한 문장을 넘기지 않는다.
- **스코프 준수**: 그 문서가 다루는 주제 밖 내용은 서술하지 않는다. 다른 주제와 닿으면 인접 문서로 위임하고 링크만 둔다. 인접 문서가 없으면 새로 만든다.
- **Ad Hoc 서술 지양**: 시점에 박힌 상태 보고("현재 상태(YYYY-MM-DD): X는 구현됨…"), 미정 결정의 시기 노트, throwaway 표기, "1차 draft" 류 메타-노트를 본문에 두지 않는다. 결정된 것은 결과만 본문에 녹이고, 미결정 사안은 적을 가치가 있을 때만 결정 자체만 간결히 쓴다. 시간이 흘러 무의미해질 문장은 처음부터 쓰지 않는다.
- **일반화**: 가능한 한 특정 구현체에 묶지 않는 표현. 예시가 필요하면 플레이스홀더(`<svc>`, `<Agg>`, `<feature>`, `<broker>`)로 일반형을 보여주고, 구체 예가 꼭 필요할 때만 별도 예제 섹션에 둔다.
- **참조형 링크 우선**: "여기서도 같은 얘기"식 복붙 대신 권위 문서 섹션으로 링크. 링크 텍스트는 그 섹션이 답하는 질문을 드러낸다.

#### 변경 전 체크
- 같은 사실을 다른 문서/섹션에서 다르게 적고 있지 않은가? (모순 점검 — 발견 시 즉시 정리)
- 변경/추가하려는 내용이 다른 source of truth와 겹친다면, 원본만 갱신하고 여기선 링크.
- 새 문서/섹션이 어디서도 참조되지 않는 orphan은 아닌가? (최소 1곳 이상에서 참조)

기준: 이 문서를 들어내면 그 주제가 갈 곳이 분명한가? 시간을 옮겨도 본문이 그대로 유효한가? 한 문서를 고칠 때 다른 문서도 함께 고쳐야 한다면 단일 출처가 깨진 신호.

### 0.10 문서 맵 (Source of truth)

| 영역 | Source of truth | 비고 |
|---|---|---|
| 작업 원칙 | 이 섹션 (`CLAUDE.md` §0) | 모든 작업의 1차 기준 |
| 무엇/왜 (제품 의도, 페르소나, 기능, 비즈니스 룰) | [`docs/01-service-spec.md`](./docs/01-service-spec.md) |  |
| 어떻게 보이는가 (디자인 원칙·화면·컴포넌트·상태·모션) | [`docs/02-ux-spec.md`](./docs/02-ux-spec.md) | 토큰 값은 `app/globals.css`, 의도만 문서에 |
| 어떻게 동작하는가 (스택·아키텍처·데이터·API·Phase) | 이 문서 `CLAUDE.md` §1~§12 |  |
| 부트스트랩~배포 수동 작업 | [`README.md`](./README.md) | 시간순 체크리스트 |
| Firestore 규칙·인덱스 / 배포 설정 | `firestore.rules`·`firestore.indexes.json`·`firebase.json` / Vercel 프로젝트 설정 | 규칙·인덱스가 진실; 배포 환경변수는 Vercel 대시보드 |
| 디자인 토큰 값 (색·radius·폰트) | `app/globals.css` (`:root`/`.dark`/`@theme`) | 문서엔 *의도*만 |

---

## 1. 목적 / 제약 (Goals & Constraints)

- **용도**: 개인용 가계부. 지출/수입을 *그때그때* 폰으로 빠르게 입력한다.
- **핵심 UX**: 모바일에서 즉시 입력(홈 화면 설치). 오프라인은 지원하지 않는다(웹 + API 전제 — 인터넷 없으면 동작 안 함).
- **비용**: 전부 Vercel(Hobby) + Firebase(Spark) 무료 한도 내. 도메인만 선택적으로 연 ~₩15,000.
- **필수 요건**: (1) 백엔드 + DB가 있을 것, (2) 사용자 데이터 export(JSON 압축, 백업 대용)가 있을 것.
- **사용자 수**: 1명(단일 사용자). 인증은 단순하게.

### Non-Goals (이번 범위 밖)
> 전체 목록·근거는 [`docs/01-service-spec.md` §6](./docs/01-service-spec.md). 동작에 직접 영향 주는 항목만 여기 명시.

- 다중 사용자 / 가족 공유 / 권한 분리
- 은행·카드 자동 연동(스크래핑/오픈뱅킹)
- **OS/모바일 푸시 알림(Web Push)** — 웹브라우저 사용 전제. 정기 거래 알림은 인앱으로만 표시.
- **자동 백업 인프라(예약 export / PITR)** — Firestore 관리형 내구성 + 사용자 주도 export(§8)로 갈음. 필요해지면 Blaze 요금제로 추후 도입.
- 예산 한도 알림 → 추후 확장 후보
- 다중 통화 — KRW 단일 통화로 가정한다.

---

## 2. 아키텍처 (Architecture)

```
Browser (PWA, 홈 화면 설치)
   │  HTTPS, same-origin (CORS 없음)
   ▼
Vercel  ── Next.js (App Router)
   ├─ 정적/SSR 프론트 (app/*)  + 엣지 CDN
   └─ Route Handlers  ── /api/* 백엔드 로직 (Node 런타임)
            │  firebase-admin (서버 전용)
            ▼
        Firebase Firestore  ── 거래/카테고리/결제수단/정기/세션/디바이스
        (보안규칙: 클라이언트 직접 접근 전면 차단 → 서버만)
```

**왜 이 구조인가**
- 프론트와 API를 **한 도메인(Vercel)** 에 두어 CORS / 크로스 서브도메인 쿠키 문제를 원천 차단한다. — 이 same-origin 전제가 §7 세션 쿠키 인증의 기반.
- **인증은 `/api/*` 핸들러가 same-origin 세션 쿠키로 직접 처리**(§7). 서드파티 IdP/게이트 없음.
- **모든 Firestore 접근을 서버(firebase-admin)로 한정**한다 → 클라이언트는 Firestore 자격증명 없이 `/api/*`만 호출하고, Firestore 보안규칙은 클라이언트 접근을 전면 차단(deny-all)한다. raw SQL·커넥션 풀이 없다(Admin SDK가 직접 호출).
- 백업은 별도 인프라 없이 **사용자 주도 export**(§8)로 갈음한다 — 예약 cron이 필요 없다.

### AWS 대응 (참고)
| Vercel / Firebase | 대략 대응되는 AWS |
|---|---|
| Vercel (정적/SSR) | S3 정적 호스팅 + CloudFront + Amplify CI |
| Next.js Route Handlers | Lambda (서버리스 함수) |
| Firestore | DynamoDB (관리형 NoSQL, scale-to-zero) |

---

## 3. 기술 스택 (Tech Stack)

- **언어**: TypeScript (프론트/백엔드 공통). 코드 주석은 영어로 작성.
- **프레임워크**: Next.js (App Router) + React + TypeScript — 프론트와 `/api/*`를 한 프로젝트에.
- **백엔드**: Next.js Route Handlers (`app/api/**/route.ts`, file-based routing, Node 런타임). ORM 없이 **firebase-admin**으로 Firestore 직접 호출.
- **DB**: Firebase Cloud Firestore (서버 전용 접근, 보안규칙 deny-all).
- **PWA**: `manifest.webmanifest` + Service Worker.
- **배포 도구**: Vercel + GitHub 연동(push 시 자동 빌드/배포). Firestore 규칙·인덱스는 Firebase CLI.

### 외부 라이브러리 방침
기본은 의존성 최소화.

**도입된/도입 예정 의존성**
- **스타일**: Tailwind v4 + shadcn/ui (`@theme` / CSS variables 기반). 토큰 값은 `app/globals.css`, 디자인 *의도*는 [`docs/02-ux-spec.md`](./docs/02-ux-spec.md).
- **DB SDK**: `firebase-admin` (서버 전용).
- **압축**: 경량 zip 라이브러리(`fflate`) — 데이터 export(§8)용.

**검토 중 (도입 전까지는 표준 API로 구현)**
- 데이터 패칭: 표준 `fetch`. 캐싱/무효화가 번거로워지면 TanStack Query 검토.
- 라우팅: 인증 경계(`/login` ↔ 메인)와 `/api/*`는 App Router 라우트로, 메인 안의 탭 전환은 클라이언트 상태로(입력 폼 상태 보존 — UX 스펙 §2). 별도 라우터 불필요.

---

## 4. 데이터 모델 (Firestore)

Firestore는 스키마리스다 — 스키마 정의 SQL/마이그레이션이 없다. 컬렉션 구조는 **이 문서가 정의**하고, 무결성은 **앱 검증(`lib/validate.ts`) + 보안규칙(`firestore.rules`, 클라이언트 deny-all)** 로 강제한다. 초기 카테고리는 시드 스크립트(`scripts/seed-categories.ts`, Admin SDK 1회 실행)로 주입. 목록 필터용 복합 인덱스는 `firestore.indexes.json`. 비즈니스 룰(말일 클램프·KST·멱등·만료 처리)의 단일 출처는 [`docs/01-service-spec.md` §8](./docs/01-service-spec.md).

설계 원칙:
- **금액은 정수(KRW, 원 단위)** — 부동소수점 금액 버그 방지.
- **일시는 KST 기준 문자열, 앱이 주입** — 모든 일시 필드(`occurred_at`·`due_at`·`created_at`·`updated_at`·`resolved_at`·`expires_at` 등)는 `'YYYY-MM-DD HH:MM:SS'`(Asia/Seoul)을 **앱 코드가 명시적으로 넣는다**. Firestore `serverTimestamp()`는 UTC라 쓰지 않는다 — 공유 헬퍼(`lib/time.ts`의 `nowKst()`)가 단일 출처. 문자열 사전식 정렬 = 시간순이라 범위 쿼리·월 묶기(`occurred_at` 앞 7글자)가 그대로 동작. (KST는 DST가 없어 고정 +9.)
- **문서 ID는 Firestore 자동 ID(string)** — 단순함 우선. FK 대신 **참조 문자열 ID 필드**(nullable)로 연결. (공유 타입의 `id`는 number가 아니라 `string`.)
- `kind ∈ {expense, income}`는 **거래·정기 거래의 속성**(앱이 검증). **카테고리에는 kind가 없다** — 카테고리는 지출/수입과 무관한 순수 라벨이라 양쪽에 쓰일 수 있다.
- 거래·정기 거래는 카테고리·결제수단을 참조 ID로 가리킨다(nullable). 둘 다 *사용 중이면 확인 후 삭제* → 참조하던 거래·정기의 해당 id를 null로(거래는 보존). 절차는 §5.
- **삭제 연쇄는 앱이 유일한 보증** — Firestore엔 FK·`ON DELETE`가 없다. set-null(카테고리·결제수단→거래·정기)·cascade(정기→회차)는 삭제 핸들러가 **Firestore batched write**로 직접 수행한다.

### 4.1 transactions (컬렉션, UC1 반영)
문서당 거래 1건. 자동 ID.
- `title: string`(필수, non-empty) — 지출명. `memo`는 선택.
- `occurred_at: string('YYYY-MM-DD HH:MM:SS')` (KST, 기본 now, 수정 가능). 목록은 이 필드로 정렬·범위 필터(복합 인덱스).
- `amount: number`(정수 >0), `kind: 'expense'|'income'`.
- `category_id: string|null`(→ categories 문서 ID) — 카테고리 삭제 시 거래 보존, 분류만 null.
- `payment_method_id: string|null`(→ payment_methods 문서 ID) — 결제수단(§4.3).
- `created_at`, `updated_at`.

### 4.2 정기 거래 (UC2)
두 컬렉션을 둔다. 개념은 [`docs/01-service-spec.md` §7](./docs/01-service-spec.md).

- **recurring** — 정기 거래 *정의*
    - `id`(자동), `title`, `amount`(>0), `kind`, `category_id: string|null`, `payment_method_id: string|null`, `memo`(nullable)
    - `cycle: 'yearly'|'monthly'|'weekly'|'daily'`
    - 결제일시 앵커 — 주기별로 쓰는 필드만 채움: `anchor_month`(연간), `anchor_day`(연간/월간), `anchor_weekday`(주간), `anchor_time: string('HH:MM')`
    - `mode: 'auto'|'notify'` — 자동추가 / 알림승인(택1)
    - `on_expire: 'skip'|'add'|'keep'` — 알림 모드의 D+5 경과 처리. `auto`면 null.
    - `start_on: string` — 회차 생성 시작일(무한 백필 방지, 기본 등록일)
    - `created_at`, `updated_at`
- **occurrences** — 도래 회차 + 상태(멱등 키)
    - **문서 ID = `${recurring_id}_${due_at}`** — `(recurring_id, due_at)` 유일성을 결정적 ID로 강제한다. 같은 회차를 두 번 만들려 해도 같은 문서를 덮어쓸 뿐 → **재조정 멱등성의 핵심**.
    - `recurring_id: string`(→ recurring 문서 ID), `due_at: string` — 그 회차 결제일시(KST)
    - `status: 'pending'|'approved'|'skipped'|'auto_added'`
    - `transaction_id: string|null` — 생성된 거래로의 연결
    - `resolved_at`(nullable), `created_at`

> 알림 윈도(D-3~D+5)·KST는 **DB에 두지 않고 코드 공유 상수**(`lib/time.ts`)로 박는다 — 정기별 설정값 아님. *값의 의미*는 service-spec §8이 단일 출처.

### 4.3 payment_methods (카드/계좌 컬렉션)
잔액은 관리하지 않는다. 결제수단은 거래·정기 거래에 붙는 *라벨*일 뿐이다.

- **payment_methods**
    - `id`(자동), `name: string`
    - `type: 'card'|'account'` — 카드 / 계좌. 생성 후 불변.
    - `archived: boolean`(기본 false) — 아카이브(선택 목록에서 숨김, 관리 페이지에만 노출). 카드 유효기간 만료 등 처리.
    - `sort_order: number`(기본 0), `created_at`
- `transactions.payment_method_id`·`recurring.payment_method_id`가 이 컬렉션의 문서 ID를 가리킨다(둘 다 nullable).
- 정기 거래가 거래를 생성할 때, 그 거래는 정기 거래의 `payment_method_id`를 **물려받는다**.
- 삭제/아카이브 정책의 단일 출처는 [`docs/01-service-spec.md` §8](./docs/01-service-spec.md).

### 4.4 인증 (세션·디바이스 컬렉션)
자격증명 해시는 Firestore에 두지 않는다(시크릿, §7.1). Firestore엔 동적 상태인 세션·디바이스만.

- **devices** — 풀 로그인 이력이 있고 퀵 PIN 자격이 있는 브라우저
    - **문서 ID = 디바이스 쿠키의 sha-256**, `label`(UA 힌트, nullable)
    - `created_at`, `expires_at`(퀵 로그인 유효기간), `failed_pin_attempts: number`(기본 0), `revoked: boolean`(기본 false)
- **sessions** — 활성 인증 세션
    - **문서 ID = 세션 쿠키의 sha-256**
    - `device_id: string|null`(→ devices 문서 ID)
    - `created_at`, `expires_at`

---

## 5. API 설계 (Next.js Route Handlers, `/api/*`)

> 단일 사용자 가정이라 user 스코프 컬럼은 두지 않는다.
> 모든 응답은 JSON. 금액은 정수(KRW).

| Method | Path | 설명 | 비고 |
|---|---|---|---|
| POST | `/api/auth/login` | 풀 로그인 | body: `{ email, password }`. 성공 시 세션 + 디바이스 쿠키 발급 |
| POST | `/api/auth/quick` | 퀵 로그인 | body: `{ pin }`. 유효 디바이스 쿠키 필수. 실패 누적 시 디바이스 폐기 |
| GET | `/api/auth/status` | 인증 상태 | `{ authed, quickAvailable }` — 프론트가 키패드/풀 로그인 결정 |
| POST | `/api/auth/logout` | 로그아웃 | 세션 폐기 |
| GET | `/api/transactions` | 거래 목록 | query: `from`,`to`(YYYY-MM-DD), `kind`, `category_id`, `payment_method_id` |
| POST | `/api/transactions` | 거래 생성 | body: `{ title, occurred_at?, amount, kind, category_id?, payment_method_id?, memo? }`. `occurred_at` 생략 시 now(KST) |
| PATCH | `/api/transactions/:id` | 거래 수정 | 부분 업데이트, `updated_at` 갱신 |
| DELETE | `/api/transactions/:id` | 거래 삭제 | hard delete(복구 보장 없음 — 주기 export로 대비, §8) |
| GET | `/api/categories` | 카테고리 목록 | |
| POST | `/api/categories` | 카테고리 생성 | body: `{ name, sort_order? }` |
| PATCH | `/api/categories/:id` | 카테고리 수정 | body: `{ name?, sort_order? }` |
| DELETE | `/api/categories/:id` | 카테고리 삭제 | 사용 중이면 409 + `{ in_use_count }`. `?force=true`면 삭제(거래·정기의 `category_id` set null) |
| GET | `/api/payment-methods` | 결제수단 목록 | query: `include_archived`(기본 false → 선택용; 관리 페이지는 true) |
| POST | `/api/payment-methods` | 결제수단 생성 | body: `{ name, type, sort_order? }` (`type ∈ {card, account}`) |
| PATCH | `/api/payment-methods/:id` | 결제수단 수정 | body: `{ name?, sort_order?, archived? }`. `type` 변경 불가 |
| DELETE | `/api/payment-methods/:id` | 결제수단 삭제 | 사용 중이면 409 + `{ in_use_count }`. `?force=true`면 삭제(앱이 거래·정기에서 set null) |
| GET | `/api/recurring` | 정기 거래 목록 | |
| POST | `/api/recurring` | 정기 거래 생성 | body: `{ title, amount, kind, category_id?, payment_method_id?, cycle, anchor_*, anchor_time, mode, on_expire?, start_on?, memo? }` |
| PATCH | `/api/recurring/:id` | 정기 거래 수정 | 부분 업데이트 |
| DELETE | `/api/recurring/:id` | 정기 거래 삭제 | 미래 회차 중단; 생성된 거래 보존; 대기 회차 제거 |
| POST | `/api/recurring/reconcile` | 도래 재조정 | 앱 진입 시 호출. **멱등**. 밀린 auto 회차 거래 생성 + notify 대기 생성 + 만료 처리 |
| GET | `/api/recurring/occurrences` | 도래 회차 목록 | query: `status`, 윈도. 인앱 알림용(윈도 내 pending + 보류) |
| POST | `/api/recurring/occurrences/:id/approve` | 승인 | 그 회차 결제일시로 거래 생성 + `status=approved` |
| POST | `/api/recurring/occurrences/:id/skip` | 해제 | `status=skipped` |
| GET | `/api/summary` | 월간 요약 | query: `month`(YYYY-MM) → 총지출/총수입 + 카테고리별 합계 |
| GET | `/api/export` | 데이터 내보내기 | 모든 컬렉션을 컬렉션별 JSON으로 → zip 압축 다운로드. 상세 §8 |

### 구현 메모
- **인증 게이트**: 루트 `middleware.ts`가 미인증 페이지 네비게이션을 로그인으로 리다이렉트하고, 각 `/api/*` 핸들러는 상단에서 `requireSession()`(Admin SDK, Node 런타임)로 세션을 검사한다(단 `/api/auth/{login,quick,status}` 제외). 상세는 §7.
- 모든 Firestore 접근은 firebase-admin으로 수행한다(클라이언트 SDK·raw SQL 없음). 보안규칙은 클라이언트 접근을 전면 차단.
- 입력 검증: `amount > 0` 정수, `kind ∈ {expense, income}`, `occurred_at` 일시 형식(KST), `title` non-empty. (`lib/validate.ts`)
- **목록 날짜 필터**: `from`/`to`(date)는 `occurred_at`의 시각 부분을 고려해 경계를 `from 00:00:00` ~ `to 23:59:59`로 잡는다 — 말일 거래가 누락되는 off-by-one 방지. (문자열 사전식 범위 쿼리, 복합 인덱스.)
- **카테고리·결제수단 삭제**: 사용 중이면 *확인 후 허용*. `force` 없으면 409 + `{ in_use_count }`. `force=true`면 핸들러가 참조 거래·정기의 `category_id`/`payment_method_id`를 **batched write로 먼저 null 처리**한 뒤 문서를 삭제한다 — Firestore엔 FK 연쇄가 없어 **앱이 유일한 보증**(§4).
- **정기 재조정(reconcile)**: 'now'(KST) 기준으로 각 정기 거래의 미생성 회차를 만든다. `auto`는 due_at ≤ now면 거래 생성(`auto_added`), `notify`는 due_at ≤ now+3d면 `pending` 생성. 만료(now > due_at+5d, 여전히 pending)는 `on_expire`(skip/add/keep) 적용. 회차 문서 ID = `${recurring_id}_${due_at}`라 중복 생성이 같은 문서 덮어쓰기 → 여러 번 호출해도 안전.
- **집계**: Firestore엔 `GROUP BY`가 없다 → `/api/summary`는 해당 월 거래를 읽어 **서버에서 인메모리 집계**한다(단일 사용자 월 수십~수백 건이라 충분). 월 필터는 `occurred_at` 앞 7글자(`YYYY-MM`) 비교.

---

## 6. 프론트엔드 (Frontend)

> 화면·컴포넌트·상태의 상세는 [`docs/02-ux-spec.md`](./docs/02-ux-spec.md). 여기는 화면 목록만.

0. **로그인 / 퀵 잠금해제 (인증 게이트)** — 미인증 시 진입. 디바이스 토큰이 유효하면 PIN 키패드(+ "일반 로그인으로" 버튼), 아니면 이메일+비번 폼.
1. **입력 화면 (기본 랜딩, 모바일 최우선)**
    - 큰 금액 입력, 지출명, 카테고리 칩, 결제수단(선택), 일시(기본 now·수정 가능), 메모(선택).
    - 한 손으로 빠르게 입력 → 저장 → 즉시 비워짐. *"그때그때"의 핵심.*
    - 진입 시 정기 재조정 호출 → 윈도 내 대기 회차를 **인앱 알림**으로 표시(승인/해제).
2. **내역 화면**
    - 월 단위 목록, 카테고리/종류/결제수단 필터, 항목 탭하여 수정·삭제. 정기 출처 거래는 배지.
3. **요약 화면**
    - 이번 달 총지출/총수입, 카테고리별 막대/합계(단순 표 + 바 수준).
4. **정기 거래 관리** — 정기 거래 CRUD(주기·결제일시·모드·만료 처리·결제수단).
5. **결제수단 관리** — 카드/계좌 CRUD + 아카이브(아카이브는 선택 목록에서 숨기고 여기에만 노출).

### PWA 요건
- `manifest.webmanifest`: 이름, 아이콘(192/512), `display: standalone`, 테마 컬러.
- Service Worker: 설치 가능(installability)·standalone 용 **최소 구성**. 오프라인 캐싱/오프라인 사용은 범위 밖.
- iOS Safari "홈 화면에 추가" 동작 확인(apple-touch-icon 포함).

---

## 7. 인증 (Auth)

**앱 자체 인증(이메일+비밀번호 + 퀵 PIN)** 으로 확정. 서드파티 IdP/게이트는 쓰지 않는다. 프론트와 `/api/*`가 같은 Vercel 도메인이라 세션 쿠키가 same-origin으로 동작하고 CORS가 없다(§2).

### 7.1 자격증명 (단일 사용자)
- 비밀번호·퀵 PIN은 **PBKDF2(SHA-256, WebCrypto) 해시**로 저장한다(§7.4 — argon2id 대신 의존성 부담을 줄이려 확정, 인터페이스는 교체 가능). 단일 사용자이고 인앱 비밀번호 변경 UI가 없으므로 Firestore가 아니라 **Vercel 환경변수**로 주입: `OWNER_EMAIL`, `AUTH_PASSWORD_HASH`, `AUTH_PIN_HASH`. Admin SDK용 서비스계정 키 `FIREBASE_SERVICE_ACCOUNT`(JSON)도 같은 방식으로 주입. 해시 생성은 `scripts/hash-credential.mjs`, 절차는 [`README.md`](./README.md).
- 퀵 PIN은 **비밀번호와 별개의 숫자 PIN(6자리)** 이다. 키패드 입력 전용.

### 7.2 세션·디바이스 (Firestore, 스키마 §4.4)
- **세션**: 풀/퀵 로그인 성공 시 opaque 토큰 발급 — 해시만 Firestore `sessions`에 저장하고 원본은 HttpOnly·Secure·SameSite=Strict 쿠키로 내린다. 수명 **기본 24h, 인증 요청마다 갱신(sliding)**. 만료·로그아웃 시 폐기.
- **디바이스 토큰**: 풀 로그인 시 장수명(유효기간, 기본 30일) 쿠키를 추가 발급, 해시를 Firestore `devices`에 저장. "이 브라우저에 로그인 이력이 있고 유효기간 내"를 뜻한다 → 퀵 PIN 노출 조건.

### 7.3 흐름
1. **풀 로그인** `POST /api/auth/login {email, password}` — `OWNER_EMAIL` 일치 + PBKDF2 검증 → 세션 + 디바이스 토큰 발급.
2. **상태 확인** `GET /api/auth/status` — 세션 유효면 인증됨. 아니면 디바이스 토큰 유효 여부로 *퀵 로그인 가능*을 응답 → 프론트가 키패드 vs 풀 로그인 화면을 결정.
3. **퀵 로그인** `POST /api/auth/quick {pin}` — 유효한 디바이스 토큰 필수 + PBKDF2 PIN 검증 → 새 세션. 키패드 화면엔 항상 **"일반 로그인으로"** 버튼.
4. **로그아웃** `POST /api/auth/logout` — 세션 폐기.

### 7.4 보호·하드닝
- 루트 `middleware.ts`(미인증 페이지 → 로그인 리다이렉트) + 각 `/api/*` 핸들러의 `requireSession()`(단 `/api/auth/{login,quick,status}` 제외)이 세션을 검사 → 무효 시 401, 프론트는 로그인으로. (Next.js Edge 미들웨어에선 Admin SDK를 못 쓰므로 실제 세션 검증은 Node 런타임 핸들러에서 수행.)
- **PIN 무차별 방지**: PIN 검증은 *디바이스 토큰 보유*가 전제(쿠키 없으면 시도 불가) + 실패 누적이 **5회** 초과 시 디바이스 토큰 폐기 → **풀 로그인으로만 복구**(추가 쿨다운 없음). 카운터는 `devices.failed_pin_attempts`.
- **풀 로그인 레이트리밋**은 MVP 미적용(느린 해시로 충분) — 필요 시 P2. 로컬 dev는 `.env.local`(gitignored)에 `OWNER_EMAIL`/`AUTH_PASSWORD_HASH`/`AUTH_PIN_HASH`/`FIREBASE_SERVICE_ACCOUNT` 주입.
- 모든 쿠키 HttpOnly·Secure·SameSite=Strict. HTTPS는 Vercel이 강제.

> **해시 방식 (확정)**: WebCrypto **PBKDF2-SHA256**(210k iters, 16B salt, `pbkdf2$iters$salt$hash` 형식)을 채택. argon2id(WASM)는 의존성·번들 부담이 있어 보류했다. 해시 인터페이스(`lib/auth.ts`의 `hashSecret`/`verifySecret`)는 격리돼 있어 추후 argon2id로 교체 가능. 로그인은 드물어 비용은 무시 가능. WebCrypto는 Node 런타임에서도 동일하게 동작.

---

## 8. 데이터 내보내기 (Export — 백업 대용)

자동 백업 인프라(예약 export·PITR) 대신 **사용자 주도 export**로 백업을 갈음한다. 데이터가 작고 단일 사용자라, 필요할 때 직접 내려받아 오프-플랫폼(로컬·드라이브)에 보관하는 것으로 충분하다. (Firestore 자체는 Google 관리형으로 복제·내구성이 보장된다 — 여기서 대비하는 건 운영 실수/벤더 사고다.)

### 구현 (`GET /api/export`)
- 인증된 핸들러가 모든 컬렉션(`transactions`·`categories`·`payment_methods`·`recurring`·`occurrences`)을 읽어 **컬렉션별 JSON 파일**(`transactions.json` 등)로 직렬화한다.
- 그 파일들을 **하나의 zip으로 압축**(`fflate`)해 `application/zip`으로 다운로드 응답한다. 파일명에 날짜 포함(예: `house-account-export-YYYY-MM-DD.zip`).
- 세션·디바이스 컬렉션은 자격 상태일 뿐이라 export에서 제외한다.
- UI 진입점은 요약 화면의 **관리**에 "데이터 내보내기" 버튼([`docs/02-ux-spec.md`](./docs/02-ux-spec.md)).
- 오프-플랫폼 보관(로컬/드라이브 복사)은 사용자가 수동으로 한다.

> 추후 자동화가 필요해지면 Vercel Cron 또는 Blaze 요금제의 예약 Firestore export로 확장할 수 있다(현재 범위 밖, §1 Non-Goals).

---

## 9. 비용 요약 (Cost)

- **Vercel Hobby(무료)**: 개인·비상업 프로젝트. 정적/SSR + Route Handlers 모두 포함.
- **Firebase Spark(무료)**: Firestore 저장 1 GiB, 읽기 50K·쓰기 20K·삭제 20K **per day**. 단일 사용자(하루 입력 수십 건)는 이 한도의 1%도 못 쓴다 → **Blaze(결제수단 등록) 불필요**.
- 백업도 사용자 주도 export(§8)라 별도 인프라·비용이 없다.
- 결론: **백엔드 + DB + export 포함 월 $0**, 커스텀 도메인 시 연 ~₩15,000.

---

## 10. 디렉터리 구조 (제안)

```
household-budget/
├─ CLAUDE.md                  # 작업 원칙(§0) + 구현 스펙(§1~§12)
├─ README.md                  # 부트스트랩~디플로이 메뉴얼 (사용자 수동 작업 체크리스트)
├─ docs/                      # 기획 문서 — 진입점은 docs/CLAUDE.md
│  ├─ CLAUDE.md               # docs 인덱스
│  ├─ 01-service-spec.md      # 무엇/왜 (제품 기획)
│  └─ 02-ux-spec.md           # 어떻게 보이는가 (UI/UX)
├─ firebase.json              # Firestore 규칙·인덱스 배포 설정
├─ .firebaserc                # Firebase 프로젝트 별칭
├─ firestore.rules            # 클라이언트 접근 전면 차단(deny-all)
├─ firestore.indexes.json     # 목록 필터용 복합 인덱스
├─ package.json
├─ next.config.ts
├─ middleware.ts              # 미인증 페이지 → 로그인 리다이렉트
├─ types.ts                   # Transaction, Category, PaymentMethod, Recurring 등 공유 타입(id: string)
├─ scripts/
│  ├─ hash-credential.mjs     # 비번/PIN PBKDF2 해시 생성 (→ Vercel 환경변수)
│  └─ seed-categories.ts      # 초기 카테고리 시드 (Admin SDK 1회 실행)
├─ lib/                       # 공유 헬퍼
│  ├─ firebase.ts             # firebase-admin 초기화(FIREBASE_SERVICE_ACCOUNT) — 서버 전용
│  ├─ db.ts                   # Firestore 컬렉션 접근 헬퍼 — 서버 전용
│  ├─ time.ts                 # nowKst() + 알림 윈도(D-3~D+5) 상수
│  ├─ validate.ts             # 입력 검증
│  ├─ auth.ts                 # 해시·세션(hashSecret/verifySecret/requireSession) — 서버 전용
│  └─ api-client.ts           # 클라이언트 fetch wrapper
├─ app/                       # Next.js App Router
│  ├─ globals.css             # Tailwind v4 @theme / 디자인 토큰
│  ├─ layout.tsx
│  ├─ login/page.tsx          # 인증 게이트: 이메일+비번 또는 PIN 키패드
│  ├─ page.tsx                # 인증된 메인 — 탭(입력/내역/요약) 클라이언트 전환(폼 상태 보존, UX §2)
│  └─ api/                    # Route Handlers = /api/*
│     ├─ auth/{login,quick,status,logout}/route.ts
│     ├─ transactions/route.ts            # GET(list) / POST
│     ├─ transactions/[id]/route.ts       # PATCH / DELETE
│     ├─ categories/route.ts              # GET / POST
│     ├─ categories/[id]/route.ts         # PATCH / DELETE
│     ├─ payment-methods/route.ts         # GET / POST
│     ├─ payment-methods/[id]/route.ts    # PATCH / DELETE(force)
│     ├─ recurring/route.ts               # GET / POST
│     ├─ recurring/[id]/route.ts          # PATCH / DELETE
│     ├─ recurring/reconcile/route.ts     # POST (멱등 재조정)
│     ├─ recurring/occurrences/route.ts   # GET (알림용 목록)
│     ├─ recurring/occurrences/[id]/{approve,skip}/route.ts  # POST 승인/해제
│     ├─ summary/route.ts                 # GET
│     └─ export/route.ts                  # GET (zip 다운로드)
├─ components/                # 화면·합성 컴포넌트 (UX 스펙 §3~§5)
│  ├─ screens/{EntryScreen,ListScreen,SummaryScreen}.tsx
│  ├─ {LoginScreen,QuickUnlockScreen}.tsx
│  ├─ {CategoryEditor,PaymentMethodEditor,RecurringScreen}.tsx  # 관리 시트
│  └─ {AmountInput,KindToggle,CategoryChips,PinKeypad, …}.tsx
└─ public/
   ├─ manifest.webmanifest
   ├─ sw.js                   # Service Worker (앱 셸)
   └─ icons/ (192, 512, apple-touch)
```

Firestore 접근은 `lib/firebase.ts`가 `FIREBASE_SERVICE_ACCOUNT` 환경변수로 firebase-admin을 초기화한다(§7.1). 보안규칙·인덱스는 `firebase deploy --only firestore`로 배포한다. `lib/firebase.ts`·`db.ts`·`auth.ts`는 서버 전용 — 클라이언트 컴포넌트에서 import하지 않는다.

---

## 11. 작업 분해 (Claude Code 실행 단계)

> 각 Phase는 독립적으로 검증 가능하게. 앞 단계가 끝나야 다음 진행.
> 사용자가 손으로 해야 하는 작업(계정 생성, 시크릿 주입, 도메인 CNAME 확인 등)은 `README.md`에 시간순 체크리스트로 정리.

- **Phase -1 — Firebase + Vercel 셋업 (수동, `README.md`)**
    - Firebase 프로젝트(Spark) 생성 → Firestore(Native mode) 활성화 → 서비스계정 키 발급.
    - Vercel 프로젝트를 GitHub 레포에 연결.
    - 환경변수 주입(`FIREBASE_SERVICE_ACCOUNT`, `OWNER_EMAIL`/`AUTH_PASSWORD_HASH`/`AUTH_PIN_HASH`) — Vercel + 로컬 `.env.local`.
    - **별도 IaC 없음** — 인프라는 Firebase 콘솔/CLI + Vercel 대시보드로 수동 구성. DNS(NS)는 Route 53에 유지하고 커스텀 도메인만 Vercel CNAME으로 연결(§12.5).
- **Phase 0 — 스캐폴딩**
    - (보일러플레이트 존재) `firebase-admin`·`fflate` 설치, `lib/` 구조 작성, `firebase.json`/`firestore.rules`/`firestore.indexes.json`/`.firebaserc` 추가.
    - 로컬 dev: `next dev` + 실 Firestore(또는 에뮬레이터)로 구동 확인.
- **Phase 1 — Firestore 데이터 모델 (베이스)**
    - 컬렉션 설계(§4) 확정 + `firestore.rules`(클라이언트 deny-all) + 목록 필터용 복합 인덱스(`firestore.indexes.json`) + `scripts/seed-categories.ts`로 카테고리 시드. (SQL 마이그레이션 없음.)
- **Phase 2 — API (Route Handlers, 베이스)**
    - transactions CRUD, categories CRUD, **payment-methods CRUD**, summary, **export** 구현 + 입력 검증.
    - 카테고리·결제수단 삭제 = 확인 후 허용(`force` → 거래·정기의 해당 id를 batched write로 null).
    - 공유 타입(`types.ts`)을 프론트/백엔드가 함께 사용.
- **Phase 3 — 프론트 화면 (베이스)**
    - EntryScreen(지출명·일시·결제수단 포함, 우선) → ListScreen → SummaryScreen → CategoryEditor → PaymentMethodEditor + 요약 관리의 **데이터 내보내기 버튼**.
    - `lib/api-client.ts` fetch wrapper.
- **Phase 4 — PWA**
    - manifest + 아이콘 + 최소 Service Worker → 홈 화면 설치/standalone 열림 확인(오프라인 캐싱 없음).
- **Phase 5 — 인증 (자체 구현)**
    - Firestore `devices`·`sessions` 컬렉션 + 시크릿 주입(`OWNER_EMAIL`/`AUTH_PASSWORD_HASH`/`AUTH_PIN_HASH`).
    - `middleware.ts` 페이지 리다이렉트 + `/api/*`의 `requireSession()` + `/api/auth/{login,quick,status,logout}`.
    - LoginScreen + QuickUnlockScreen(키패드) + 401→로그인 리다이렉트.
    - 해시는 WebCrypto PBKDF2(§7.4, `lib/auth.ts`).
- **Phase 6 — 정기 거래 (UC2)**
    - `recurring`·`occurrences` 컬렉션(회차 문서 ID = `${recurring_id}_${due_at}`).
    - recurring CRUD + `reconcile`(멱등) + occurrences(approve/skip) API.
    - RecurringScreen(등록/수정 폼) + 앱 진입 시 reconcile → 인앱 알림(승인/해제) + 만료 처리(skip/add/keep).

---

## 12. 결정사항 (Decisions)

1. **거래 종류** — `expense` + `income` 둘 다 지원 (`kind` 컬럼 유지).
2. **인증** — **앱 자체 인증**(이메일+비밀번호 + 퀵 PIN). PBKDF2 해시, Firestore 세션/디바이스, `middleware.ts` + `requireSession()` 게이트. 서드파티 IdP/게이트 미사용. §7 참고.
3. **카테고리** — 기본 시드(§4) 제공 + 자유롭게 추가/수정/삭제. **kind와 무관한 라벨**(지출/수입 양쪽에 사용). 삭제는 확인 후 완전삭제(거래·정기에서 set null). API는 §5.
4. **통화** — KRW 단일 통화. `amount`는 정수(원 단위). 다통화 미지원.
5. **도메인** — AWS Route 53 등록 도메인을 사용하고 **DNS(NS)도 Route 53에 유지**(기존 레코드 보존). Vercel 커스텀 도메인은 **서브도메인 CNAME**(Route 53 → `cname.vercel-dns.com`)으로 연결한다. apex는 외부 DNS에서 CNAME이 불가하므로 서브도메인을 쓴다.
6. **거래 모델 확장 (UC1)** — 지출명 `title`(필수) + 발생일시 `occurred_at`(datetime, KST, 기본 now·수정 가능). `occurred_on`(date) 폐기.
7. **정기 거래 (UC2)** — 지출·수입 모두. 주기 연/월/주/일 + 결제일시 앵커. 모드 택1(자동추가/알림승인). 알림 윈도 D-3~D+5. 만료 처리(skip/add/keep) 정기별 옵션. 멱등 회차(occurrence) 추적. 룰 단일 출처는 [`docs/01-service-spec.md` §8](./docs/01-service-spec.md).
8. **정기 처리 엔진** — OS 푸시 미사용(웹브라우저 전제). 앱 진입 시 `reconcile`로 처리, 알림은 인앱. 서버 cron 백스톱은 P2.
9. **결제수단** — 카드/계좌 단일 컬렉션(`type`). **잔액 미관리**. 거래·정기에 선택 부착(nullable). 삭제 = 확인 후 완전삭제(거래에서 set null), 아카이브 = 선택 목록에서 숨기고 관리 페이지에만 노출.
10. **스택** — 프레임워크 Next.js(App Router) + 호스팅 Vercel. DB는 Firebase Cloud Firestore(서버 전용 접근, 보안규칙 deny-all). §2·§3 참고.
11. **백업 → export** — 자동 백업 인프라(예약 export·PITR) 대신 **사용자 주도 JSON 압축 export**(`/api/export`)로 갈음. §8 참고.

> 변경 시 해당 Phase만 조정한다. 다통화 등 큰 변경이 필요해지면 §4 데이터 모델부터 재설계.