import "server-only";
import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type DocumentReference,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { db } from "@/lib/server/firebase";
import { enumerateOccurrences, type Schedule } from "./schedule";

const DAY = 24 * 60 * 60 * 1000;
const WINDOW_BEFORE = 3 * DAY; // 도래 전 알림 선노출(D-3)
const WINDOW_AFTER = 5 * DAY; // 알림 윈도 종료(D+5)
const LOOKBACK_CAP = 400 * DAY; // 오래 미접속 시 회차 폭주 방지
const THROTTLE = 60 * 1000;

const USERS = "users";
const RECURRING = "recurring";
const OCCURRENCES = "occurrences";
const TRANSACTIONS = "transactions";

function userDoc(uid: string) {
  return db().collection(USERS).doc(uid);
}

// ! - 도래한 정기 회차를 멱등하게 채운다(자동 모드는 거래도 실체화). 앱 진입 시 호출.
export async function reconcile(uid: string, force = false): Promise<void> {
  const now = new Date();
  const userRef = userDoc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return;
  const last = userSnap.get("lastReconciledAt") as Timestamp | undefined;
  if (!force && last && now.getTime() - last.toDate().getTime() < THROTTLE) return;

  const defs = await userRef.collection(RECURRING).get();
  for (const defDoc of defs.docs) {
    await reconcileDef(uid, defDoc, now);
  }
  await userRef.update({ lastReconciledAt: Timestamp.fromDate(now) });
}

async function reconcileDef(
  uid: string,
  defDoc: QueryDocumentSnapshot,
  now: Date,
): Promise<void> {
  const def = defDoc.data();
  const defId = defDoc.id;
  const lastReconciled = (def.lastReconciledAt as Timestamp).toDate();
  const from = new Date(Math.max(lastReconciled.getTime(), now.getTime() - LOOKBACK_CAP));
  const isNotify = def.mode === "notify";
  const to = new Date(now.getTime() + (isNotify ? WINDOW_BEFORE : 0));

  const schedule: Schedule = {
    freq: def.freq,
    month: def.month,
    day: def.day,
    weekday: def.weekday,
    hour: def.hour,
    minute: def.minute,
  };
  for (const occAt of enumerateOccurrences(schedule, from, to)) {
    await ensureOccurrence(uid, defId, def, occAt, isNotify);
  }
  if (isNotify) await expirePending(uid, defId, def, now);
  await defDoc.ref.update({ lastReconciledAt: Timestamp.fromDate(now) });
}

function snapshotOf(def: DocumentData) {
  return {
    name: def.name,
    amount: def.amount,
    type: def.type,
    categoryId: def.categoryId ?? null,
    paymentMethodId: def.paymentMethodId ?? null,
  };
}

// 결정적 회차 id로 멱등 보장. 자동 모드는 거래 생성과 상태 전이를 원자적으로 묶는다.
async function ensureOccurrence(
  uid: string,
  defId: string,
  def: DocumentData,
  occAt: Date,
  isNotify: boolean,
): Promise<void> {
  const occRef = userDoc(uid).collection(OCCURRENCES).doc(`${defId}_${occAt.getTime()}`);
  const ts = Timestamp.fromDate(occAt);
  await db().runTransaction(async (tx) => {
    if ((await tx.get(occRef)).exists) return;
    const snap = snapshotOf(def);
    if (isNotify) {
      tx.set(occRef, {
        defId,
        occurredAt: ts,
        status: "pending",
        txId: null,
        ...snap,
        createdAt: FieldValue.serverTimestamp(),
      });
    } else {
      const txRef = userDoc(uid).collection(TRANSACTIONS).doc();
      tx.set(txRef, {
        ...snap,
        occurredAt: ts,
        memo: null,
        source: "recurring",
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(occRef, {
        defId,
        occurredAt: ts,
        status: "auto",
        txId: txRef.id,
        ...snap,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  });
}

// 알림 윈도(D+5)를 넘긴 미응답 회차를 정의의 만료 정책대로 처리한다.
async function expirePending(
  uid: string,
  defId: string,
  def: DocumentData,
  now: Date,
): Promise<void> {
  if (def.expiry === "hold") return;
  const cutoff = now.getTime() - WINDOW_AFTER;
  const snap = await userDoc(uid).collection(OCCURRENCES).where("defId", "==", defId).get();
  const expired = snap.docs.filter(
    (d) =>
      d.get("status") === "pending" &&
      (d.get("occurredAt") as Timestamp).toDate().getTime() < cutoff,
  );
  for (const d of expired) {
    if (def.expiry === "skip") {
      await d.ref.update({ status: "skipped" });
    } else {
      await materializeFromOcc(uid, d.ref);
    }
  }
}

async function materializeFromOcc(
  uid: string,
  occRef: DocumentReference,
): Promise<void> {
  const txRef = userDoc(uid).collection(TRANSACTIONS).doc();
  await db().runTransaction(async (tx) => {
    const occ = await tx.get(occRef);
    if (!occ.exists || occ.get("status") !== "pending") return;
    tx.set(txRef, {
      name: occ.get("name"),
      amount: occ.get("amount"),
      type: occ.get("type"),
      categoryId: occ.get("categoryId") ?? null,
      paymentMethodId: occ.get("paymentMethodId") ?? null,
      occurredAt: occ.get("occurredAt"),
      memo: null,
      source: "recurring",
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(occRef, { status: "approved", txId: txRef.id });
  });
}
