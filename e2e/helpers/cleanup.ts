import { FieldPath } from "firebase-admin/firestore";
import { adminDb } from "./admin";
import { TEST_EMAIL_PREFIX, isTestEmail } from "./namespace";

// 프리픽스 범위쿼리 상한. 프리픽스로 시작하는 모든 doc id를 포함한다.
const PREFIX_RANGE_END = `${TEST_EMAIL_PREFIX}￿`;

// 한 테스트가 만든 유저와 그 하위 데이터를 제거한다.
export async function deleteUser(uid: string, email: string): Promise<void> {
  const db = adminDb();
  await db.recursiveDelete(db.collection("users").doc(uid));
  await db.collection("emailIndex").doc(email).delete();
}

export async function deleteUserByEmail(email: string): Promise<void> {
  const db = adminDb();
  const idx = await db.collection("emailIndex").doc(email).get();
  if (idx.exists) {
    const uid = idx.get("uid") as string;
    if (uid) await db.recursiveDelete(db.collection("users").doc(uid));
  }
  await db.collection("emailIndex").doc(email).delete();
}

// 안전 불변식: e2e- 프리픽스 범위쿼리로 좁히고, 다시 isTestEmail로 이중 가드한 문서만
// 삭제한다. 프리픽스 밖(=실데이터)은 어떤 경로로도 건드리지 않는다.
export async function sweepTestUsers(): Promise<number> {
  const db = adminDb();
  const snap = await db
    .collection("emailIndex")
    .orderBy(FieldPath.documentId())
    .startAt(TEST_EMAIL_PREFIX)
    .endAt(PREFIX_RANGE_END)
    .get();
  let removed = 0;
  for (const doc of snap.docs) {
    if (!isTestEmail(doc.id)) continue;
    const uid = doc.get("uid") as string;
    if (uid) await db.recursiveDelete(db.collection("users").doc(uid));
    await doc.ref.delete();
    removed += 1;
  }
  return removed;
}
