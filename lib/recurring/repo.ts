import "server-only";
import {
  FieldValue,
  Timestamp,
  type DocumentSnapshot,
} from "firebase-admin/firestore";
import { db } from "@/lib/server/firebase";
import type {
  ExpiryPolicy,
  Freq,
  Occurrence,
  RecurMode,
  RecurringDef,
  TxType,
} from "@/lib/domain/types";
import type { TxData } from "@/lib/domain/repo";

const USERS = "users";
const RECURRING = "recurring";
const OCCURRENCES = "occurrences";
const TRANSACTIONS = "transactions";

function userDoc(uid: string) {
  return db().collection(USERS).doc(uid);
}
function defCol(uid: string) {
  return userDoc(uid).collection(RECURRING);
}
function occCol(uid: string) {
  return userDoc(uid).collection(OCCURRENCES);
}

export type DefInput = Omit<RecurringDef, "id">;

function mapDef(d: DocumentSnapshot): RecurringDef {
  return {
    id: d.id,
    name: d.get("name") as string,
    type: d.get("type") as TxType,
    amount: d.get("amount") as number,
    categoryId: (d.get("categoryId") as string | null) ?? null,
    paymentMethodId: (d.get("paymentMethodId") as string | null) ?? null,
    freq: d.get("freq") as Freq,
    month: d.get("month") as number,
    day: d.get("day") as number,
    weekday: d.get("weekday") as number,
    hour: d.get("hour") as number,
    minute: d.get("minute") as number,
    mode: d.get("mode") as RecurMode,
    expiry: d.get("expiry") as ExpiryPolicy,
  };
}

function mapOcc(d: DocumentSnapshot): Occurrence {
  return {
    id: d.id,
    defId: d.get("defId") as string,
    occurredAt: (d.get("occurredAt") as Timestamp).toDate(),
    status: d.get("status") as Occurrence["status"],
    name: d.get("name") as string,
    amount: d.get("amount") as number,
    type: d.get("type") as TxType,
    categoryId: (d.get("categoryId") as string | null) ?? null,
    paymentMethodId: (d.get("paymentMethodId") as string | null) ?? null,
  };
}

/* ── 정의 ── */

export async function listDefs(uid: string): Promise<RecurringDef[]> {
  const snap = await defCol(uid).orderBy("createdAt").get();
  return snap.docs.map(mapDef);
}

export async function addDef(uid: string, data: DefInput): Promise<void> {
  const now = Timestamp.now();
  await defCol(uid).add({
    ...data,
    createdAt: now,
    lastReconciledAt: now,
  });
}

export async function updateDef(
  uid: string,
  id: string,
  data: DefInput,
): Promise<void> {
  await defCol(uid).doc(id).update({ ...data });
}

// ! - 정의와 함께 그 정의의 대기 회차를 제거한다. 이미 만들어진 거래·회차는 보존한다.
export async function deleteDef(uid: string, id: string): Promise<void> {
  const pending = await occCol(uid).where("defId", "==", id).get();
  const batch = db().batch();
  pending.docs
    .filter((d) => d.get("status") === "pending")
    .forEach((d) => batch.delete(d.ref));
  batch.delete(defCol(uid).doc(id));
  await batch.commit();
}

// 정의 수정을 대기 회차 스냅샷에 반영한다.
export async function reflectToPending(
  uid: string,
  defId: string,
  data: DefInput,
): Promise<void> {
  const snap = await occCol(uid).where("defId", "==", defId).get();
  const batch = db().batch();
  snap.docs
    .filter((d) => d.get("status") === "pending")
    .forEach((d) =>
      batch.update(d.ref, {
        name: data.name,
        amount: data.amount,
        type: data.type,
        categoryId: data.categoryId,
        paymentMethodId: data.paymentMethodId,
      }),
    );
  await batch.commit();
}

/* ── 회차 ── */

export async function listPendingOccurrences(uid: string): Promise<Occurrence[]> {
  const snap = await occCol(uid).where("status", "==", "pending").get();
  return snap.docs
    .map(mapOcc)
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
}

export async function countPending(uid: string): Promise<number> {
  return (await occCol(uid).where("status", "==", "pending").count().get()).data()
    .count;
}

// 승인 → 회차 스냅샷으로 거래를 만들고 상태를 바꾼다(원자적). 이미 처리된 회차면 무시.
export async function approveOccurrence(uid: string, occId: string): Promise<void> {
  const occRef = occCol(uid).doc(occId);
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

// 수정 후 승인 → 회차 스냅샷 대신 넘겨받은 값으로 거래를 만들고 상태를 바꾼다(원자적). 이미 처리된 회차면 무시.
export async function approveOccurrenceWith(
  uid: string,
  occId: string,
  data: TxData,
): Promise<void> {
  const occRef = occCol(uid).doc(occId);
  const txRef = userDoc(uid).collection(TRANSACTIONS).doc();
  await db().runTransaction(async (tx) => {
    const occ = await tx.get(occRef);
    if (!occ.exists || occ.get("status") !== "pending") return;
    tx.set(txRef, {
      ...data,
      occurredAt: Timestamp.fromDate(data.occurredAt),
      source: "recurring",
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(occRef, { status: "approved", txId: txRef.id });
  });
}

export async function skipOccurrence(uid: string, occId: string): Promise<void> {
  const occRef = occCol(uid).doc(occId);
  await db().runTransaction(async (tx) => {
    const occ = await tx.get(occRef);
    if (!occ.exists || occ.get("status") !== "pending") return;
    tx.update(occRef, { status: "skipped" });
  });
}
