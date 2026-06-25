import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./admin";
import type {
  Category,
  Occurrence,
  Payment,
  RecurringDef,
  Transaction,
} from "../../lib/domain/types";

function userRef(uid: string) {
  return adminDb().collection("users").doc(uid);
}

export async function userExists(uid: string): Promise<boolean> {
  return (await userRef(uid).get()).exists;
}

export async function getUserField(uid: string, field: string): Promise<unknown> {
  return (await userRef(uid).get()).get(field);
}

export async function getPasswordHash(uid: string): Promise<string | null> {
  const v = (await userRef(uid).get()).get("passwordHash");
  return typeof v === "string" ? v : null;
}

export async function getDefaultPaymentId(uid: string): Promise<string | null> {
  const v = (await userRef(uid).get()).get("defaultPaymentMethodId");
  return typeof v === "string" ? v : null;
}

export async function uidByEmail(email: string): Promise<string | null> {
  const idx = await adminDb().collection("emailIndex").doc(email).get();
  return idx.exists ? (idx.get("uid") as string) : null;
}

export async function listTransactions(uid: string): Promise<Transaction[]> {
  const snap = await userRef(uid).collection("transactions").get();
  return snap.docs.map((d) => ({
    id: d.id,
    name: d.get("name") as string,
    amount: d.get("amount") as number,
    type: d.get("type") as Transaction["type"],
    categoryId: (d.get("categoryId") as string | null) ?? null,
    paymentMethodId: (d.get("paymentMethodId") as string | null) ?? null,
    occurredAt: (d.get("occurredAt") as Timestamp).toDate(),
    memo: (d.get("memo") as string | null) ?? null,
    source: (d.get("source") as Transaction["source"]) ?? "manual",
  }));
}

export async function findTransaction(
  uid: string,
  predicate: (t: Transaction) => boolean,
): Promise<Transaction | undefined> {
  return (await listTransactions(uid)).find(predicate);
}

export async function listCategories(uid: string): Promise<Category[]> {
  const snap = await userRef(uid).collection("categories").orderBy("order").get();
  return snap.docs.map((d) => ({
    id: d.id,
    name: d.get("name") as string,
    order: d.get("order") as number,
  }));
}

export async function listPayments(uid: string): Promise<Payment[]> {
  const snap = await userRef(uid).collection("paymentMethods").orderBy("order").get();
  return snap.docs.map((d) => ({
    id: d.id,
    name: d.get("name") as string,
    kind: d.get("kind") as Payment["kind"],
    archived: !!d.get("archived"),
    order: d.get("order") as number,
  }));
}

export async function getDef(uid: string, id: string): Promise<RecurringDef | null> {
  const d = await userRef(uid).collection("recurring").doc(id).get();
  if (!d.exists) return null;
  return {
    id: d.id,
    name: d.get("name") as string,
    type: d.get("type") as RecurringDef["type"],
    amount: d.get("amount") as number,
    categoryId: (d.get("categoryId") as string | null) ?? null,
    paymentMethodId: (d.get("paymentMethodId") as string | null) ?? null,
    freq: d.get("freq") as RecurringDef["freq"],
    month: d.get("month") as number,
    day: d.get("day") as number,
    weekday: d.get("weekday") as number,
    hour: d.get("hour") as number,
    minute: d.get("minute") as number,
    mode: d.get("mode") as RecurringDef["mode"],
    expiry: d.get("expiry") as RecurringDef["expiry"],
  };
}

export async function listDefs(uid: string): Promise<RecurringDef[]> {
  const snap = await userRef(uid).collection("recurring").get();
  const out: RecurringDef[] = [];
  for (const d of snap.docs) {
    const def = await getDef(uid, d.id);
    if (def) out.push(def);
  }
  return out;
}

export async function getOccurrence(uid: string, id: string): Promise<Occurrence | null> {
  const d = await userRef(uid).collection("occurrences").doc(id).get();
  if (!d.exists) return null;
  return {
    id: d.id,
    defId: d.get("defId") as string,
    occurredAt: (d.get("occurredAt") as Timestamp).toDate(),
    status: d.get("status") as Occurrence["status"],
    name: d.get("name") as string,
    amount: d.get("amount") as number,
    type: d.get("type") as Occurrence["type"],
    categoryId: (d.get("categoryId") as string | null) ?? null,
    paymentMethodId: (d.get("paymentMethodId") as string | null) ?? null,
  };
}

export async function listOccurrences(uid: string): Promise<Occurrence[]> {
  const snap = await userRef(uid).collection("occurrences").get();
  const out: Occurrence[] = [];
  for (const d of snap.docs) {
    const occ = await getOccurrence(uid, d.id);
    if (occ) out.push(occ);
  }
  return out;
}

export async function listDevices(
  uid: string,
): Promise<{ deviceId: string; failCount: number }[]> {
  const snap = await userRef(uid).collection("devices").get();
  return snap.docs.map((d) => ({
    deviceId: d.id,
    failCount: (d.get("failCount") as number) ?? 0,
  }));
}
