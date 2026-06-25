import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { requireEnv } from "./env";

let cached: Firestore | undefined;

// 테스트 러너 전용 Firestore 핸들. 앱과 동일한 실 서비스계정으로 같은 프로젝트에 직접 붙어
// UI가 일으킨 쓰기 결과를 직접 단언하거나 테스트 데이터를 시드/정리한다.
export function adminDb(): Firestore {
  if (cached) return cached;
  const app =
    getApps()[0] ??
    initializeApp({ credential: cert(JSON.parse(requireEnv("FIREBASE_SERVICE_ACCOUNT"))) });
  cached = getFirestore(app);
  cached.settings({ ignoreUndefinedProperties: true });
  return cached;
}
