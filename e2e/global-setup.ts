import { adminDb } from "./helpers/admin";
import { requireEnv } from "./helpers/env";

// 시크릿·프로젝트 연결을 쓰기→읽기 1회로 검증해 오설정을 즉시 실패시킨다.
// (러너의 Firestore 핸들과 앱이 같은 프로젝트를 보는지 확인하는 1차 방어선.)
export default async function globalSetup(): Promise<void> {
  requireEnv("JWT_SECRET");
  requireEnv("PASSWORD_PEPPER");
  requireEnv("PIN_PEPPER");

  const db = adminDb();
  const ref = db.collection("emailIndex").doc("e2e-__preflight__@e2e.invalid");
  await ref.set({ uid: "__preflight__" });
  const back = await ref.get();
  if (!back.exists || back.get("uid") !== "__preflight__") {
    throw new Error("E2E preflight: Firestore 쓰기/읽기 왕복에 실패했습니다.");
  }
  await ref.delete();
}
