import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { env } from "./env";

let cached: Firestore | undefined;

// 서버 전용 Firestore 핸들. 프로세스당 한 번만 초기화한다(HMR 재실행 안전).
export function db(): Firestore {
  if (cached) return cached;
  const existing = getApps()[0];
  const app =
    existing ??
    initializeApp({ credential: cert(JSON.parse(env.firebaseServiceAccount)) });
  const firestore = getFirestore(app);
  // preferRest: 서버리스 콜드스타트 시 gRPC 채널 수립 비용을 피해 첫 쿼리를 줄인다.
  if (!existing) firestore.settings({ ignoreUndefinedProperties: true, preferRest: true });
  cached = firestore;
  return firestore;
}
