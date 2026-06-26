import "server-only";
import {
  FieldValue,
  Timestamp,
  type CollectionReference,
  type DocumentSnapshot,
} from "firebase-admin/firestore";
import { db } from "@/lib/server/firebase";
import type {
  Category,
  Payment,
  PaymentKind,
  Transaction,
  TxSource,
  TxType,
} from "./types";

const USERS = "users";
const CATEGORIES = "categories";
const PAYMENTS = "paymentMethods";
const TRANSACTIONS = "transactions";

function userDoc(uid: string) {
  return db().collection(USERS).doc(uid);
}
function catCol(uid: string) {
  return userDoc(uid).collection(CATEGORIES);
}
function payCol(uid: string) {
  return userDoc(uid).collection(PAYMENTS);
}
function txCol(uid: string) {
  return userDoc(uid).collection(TRANSACTIONS);
}

async function nextOrder(col: CollectionReference): Promise<number> {
  const snap = await col.orderBy("order", "desc").limit(1).get();
  return snap.empty ? 0 : (snap.docs[0].get("order") as number) + 1;
}

// 인접 항목과 order 값을 맞바꿔 한 칸 이동한다.
async function swapOrder(
  col: CollectionReference,
  id: string,
  dir: -1 | 1,
): Promise<void> {
  const docs = (await col.orderBy("order").get()).docs;
  const i = docs.findIndex((d) => d.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= docs.length) return;
  const batch = db().batch();
  batch.update(docs[i].ref, { order: docs[j].get("order") });
  batch.update(docs[j].ref, { order: docs[i].get("order") });
  await batch.commit();
}

// 거래의 참조 필드가 value인 건들을 null로 비운다(거래 자체는 보존).
async function clearTxReference(
  uid: string,
  field: "categoryId" | "paymentMethodId",
  value: string,
): Promise<void> {
  const snap = await txCol(uid).where(field, "==", value).get();
  if (snap.empty) return;
  const batch = db().batch();
  snap.docs.forEach((d) => batch.update(d.ref, { [field]: null }));
  await batch.commit();
}

/* ── 카테고리 ── */

export async function listCategories(uid: string): Promise<Category[]> {
  const snap = await catCol(uid).orderBy("order").get();
  return snap.docs.map((d) => ({
    id: d.id,
    name: d.get("name") as string,
    order: d.get("order") as number,
  }));
}

export async function addCategory(uid: string, name: string): Promise<void> {
  await catCol(uid).add({ name, order: await nextOrder(catCol(uid)) });
}

export async function renameCategory(
  uid: string,
  id: string,
  name: string,
): Promise<void> {
  await catCol(uid).doc(id).update({ name });
}

export async function moveCategory(
  uid: string,
  id: string,
  dir: -1 | 1,
): Promise<void> {
  await swapOrder(catCol(uid), id, dir);
}

export async function countCategoryUsage(uid: string, id: string): Promise<number> {
  return (await txCol(uid).where("categoryId", "==", id).count().get()).data().count;
}

// ! - 이 카테고리를 쓰던 거래의 categoryId를 모두 비운 뒤 삭제한다.
export async function deleteCategory(uid: string, id: string): Promise<void> {
  await clearTxReference(uid, "categoryId", id);
  await catCol(uid).doc(id).delete();
}

export async function seedCategories(uid: string, names: string[]): Promise<void> {
  const batch = db().batch();
  names.forEach((name, i) => batch.set(catCol(uid).doc(), { name, order: i }));
  await batch.commit();
}

/* ── 결제수단 ── */

export async function listPayments(
  uid: string,
  opts?: { includeArchived?: boolean },
): Promise<Payment[]> {
  const snap = await payCol(uid).orderBy("order").get();
  const all = snap.docs.map((d) => ({
    id: d.id,
    name: d.get("name") as string,
    kind: d.get("kind") as PaymentKind,
    archived: !!d.get("archived"),
    order: d.get("order") as number,
  }));
  return opts?.includeArchived ? all : all.filter((p) => !p.archived);
}

export async function addPayment(
  uid: string,
  name: string,
  kind: PaymentKind,
): Promise<void> {
  await payCol(uid).add({
    name,
    kind,
    archived: false,
    order: await nextOrder(payCol(uid)),
  });
}

export async function renamePayment(
  uid: string,
  id: string,
  name: string,
): Promise<void> {
  await payCol(uid).doc(id).update({ name });
}

export async function setPaymentArchived(
  uid: string,
  id: string,
  archived: boolean,
): Promise<void> {
  await payCol(uid).doc(id).update({ archived });
  if (archived) await unsetDefaultIf(uid, id);
}

export async function movePayment(
  uid: string,
  id: string,
  dir: -1 | 1,
): Promise<void> {
  await swapOrder(payCol(uid), id, dir);
}

export async function countPaymentUsage(uid: string, id: string): Promise<number> {
  return (await txCol(uid).where("paymentMethodId", "==", id).count().get()).data()
    .count;
}

// ! - 이 결제수단을 쓰던 거래의 참조를 모두 비우고 기본 지정을 푼 뒤 삭제한다.
export async function deletePayment(uid: string, id: string): Promise<void> {
  await clearTxReference(uid, "paymentMethodId", id);
  await unsetDefaultIf(uid, id);
  await payCol(uid).doc(id).delete();
}

export async function getDefaultPaymentId(uid: string): Promise<string | null> {
  const v = (await userDoc(uid).get()).get("defaultPaymentMethodId");
  return typeof v === "string" ? v : null;
}

export async function setDefaultPayment(
  uid: string,
  id: string | null,
): Promise<void> {
  await userDoc(uid).update({ defaultPaymentMethodId: id });
}

async function unsetDefaultIf(uid: string, id: string): Promise<void> {
  if ((await getDefaultPaymentId(uid)) === id) await setDefaultPayment(uid, null);
}

/* ── 거래 ── */

export type TxData = {
  name: string;
  amount: number;
  type: TxType;
  categoryId: string | null;
  paymentMethodId: string | null;
  occurredAt: Date;
  memo: string | null;
};

function mapTx(d: DocumentSnapshot): Transaction {
  return {
    id: d.id,
    name: d.get("name") as string,
    amount: d.get("amount") as number,
    type: d.get("type") as TxType,
    categoryId: (d.get("categoryId") as string | null) ?? null,
    paymentMethodId: (d.get("paymentMethodId") as string | null) ?? null,
    occurredAt: (d.get("occurredAt") as Timestamp).toDate(),
    memo: (d.get("memo") as string | null) ?? null,
    source: (d.get("source") as TxSource) ?? "manual",
  };
}

export async function listTransactionsInRange(
  uid: string,
  range: { start: Date; end: Date },
): Promise<Transaction[]> {
  const snap = await txCol(uid)
    .where("occurredAt", ">=", Timestamp.fromDate(range.start))
    .where("occurredAt", "<", Timestamp.fromDate(range.end))
    .orderBy("occurredAt", "desc")
    .get();
  return snap.docs.map(mapTx);
}

export async function listRecentTransactions(
  uid: string,
  limit: number,
): Promise<Transaction[]> {
  const snap = await txCol(uid)
    .orderBy("occurredAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map(mapTx);
}

export async function addTransaction(uid: string, data: TxData): Promise<void> {
  await txCol(uid).add({
    ...data,
    occurredAt: Timestamp.fromDate(data.occurredAt),
    source: "manual" satisfies TxSource,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function getTransaction(
  uid: string,
  id: string,
): Promise<Transaction | null> {
  const d = await txCol(uid).doc(id).get();
  return d.exists ? mapTx(d) : null;
}

export async function updateTransaction(
  uid: string,
  id: string,
  data: TxData,
): Promise<void> {
  await txCol(uid)
    .doc(id)
    .update({ ...data, occurredAt: Timestamp.fromDate(data.occurredAt) });
}

export async function deleteTransaction(uid: string, id: string): Promise<void> {
  await txCol(uid).doc(id).delete();
}
