import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./admin";
import { hashPassword, hashPin } from "./argon";
import { newTestEmail } from "./namespace";
import { DEFAULT_CATEGORIES } from "../../lib/domain/defaults";
import { DEVICE_TTL_DAYS } from "../../lib/auth/constants";
import type {
  ExpiryPolicy,
  Freq,
  OccStatus,
  PaymentKind,
  RecurMode,
  TxSource,
  TxType,
} from "../../lib/domain/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export type SeededUser = { uid: string; email: string; password: string };

function userRef(uid: string) {
  return adminDb().collection("users").doc(uid);
}

// 앱의 createUser + seedCategories와 동일한 문서 모양으로 테스트 유저를 만든다.
export async function seedUser(opts?: {
  password?: string;
  withCategories?: boolean;
}): Promise<SeededUser> {
  const db = adminDb();
  const email = newTestEmail();
  const password = opts?.password ?? "test-pass-1234";
  const ref = db.collection("users").doc();
  await ref.set({
    emailLower: email,
    passwordHash: await hashPassword(password),
    createdAt: FieldValue.serverTimestamp(),
  });
  await db.collection("emailIndex").doc(email).set({ uid: ref.id });
  if (opts?.withCategories !== false) {
    const batch = db.batch();
    DEFAULT_CATEGORIES.forEach((name, i) =>
      batch.set(ref.collection("categories").doc(), { name, order: i }),
    );
    await batch.commit();
  }
  return { uid: ref.id, email, password };
}

export async function seedCategory(uid: string, name: string, order: number): Promise<string> {
  const ref = userRef(uid).collection("categories").doc();
  await ref.set({ name, order });
  return ref.id;
}

export async function seedPayment(
  uid: string,
  name: string,
  opts?: { kind?: PaymentKind; archived?: boolean; order?: number },
): Promise<string> {
  const ref = userRef(uid).collection("paymentMethods").doc();
  await ref.set({
    name,
    kind: opts?.kind ?? "card",
    archived: opts?.archived ?? false,
    order: opts?.order ?? 0,
  });
  return ref.id;
}

export async function setDefaultPayment(uid: string, paymentId: string | null): Promise<void> {
  await userRef(uid).update({ defaultPaymentMethodId: paymentId });
}

export async function seedTransaction(
  uid: string,
  data: {
    name: string;
    amount: number;
    type: TxType;
    occurredAt: Date;
    categoryId?: string | null;
    paymentMethodId?: string | null;
    memo?: string | null;
    source?: TxSource;
  },
): Promise<string> {
  const ref = userRef(uid).collection("transactions").doc();
  await ref.set({
    name: data.name,
    amount: data.amount,
    type: data.type,
    categoryId: data.categoryId ?? null,
    paymentMethodId: data.paymentMethodId ?? null,
    occurredAt: Timestamp.fromDate(data.occurredAt),
    memo: data.memo ?? null,
    source: data.source ?? "manual",
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function seedDevice(
  uid: string,
  pin: string,
  opts?: { failCount?: number; expiresAt?: Date },
): Promise<string> {
  const ref = userRef(uid).collection("devices").doc();
  await ref.set({
    pinHash: await hashPin(pin),
    failCount: opts?.failCount ?? 0,
    uaHint: "e2e",
    createdAt: FieldValue.serverTimestamp(),
    lastUsedAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromDate(
      opts?.expiresAt ?? new Date(Date.now() + DEVICE_TTL_DAYS * DAY_MS),
    ),
  });
  return ref.id;
}

export type SeedDef = {
  name: string;
  type?: TxType;
  amount?: number;
  categoryId?: string | null;
  paymentMethodId?: string | null;
  freq?: Freq;
  month?: number;
  day?: number;
  weekday?: number;
  hour?: number;
  minute?: number;
  mode?: RecurMode;
  expiry?: ExpiryPolicy;
};

// 정기 정의를 만든다. lastReconciledAt을 과거로 두면 다음 페이지 로드의 reconcile이
// 그 사이 도래분을 채운다(자동 모드 실체화·알림 모드 대기 회차 검증용).
export async function seedRecurringDef(
  uid: string,
  def: SeedDef,
  opts?: { lastReconciledAt?: Date },
): Promise<string> {
  const ref = userRef(uid).collection("recurring").doc();
  const last = Timestamp.fromDate(opts?.lastReconciledAt ?? new Date());
  await ref.set({
    name: def.name,
    type: def.type ?? "expense",
    amount: def.amount ?? 10000,
    categoryId: def.categoryId ?? null,
    paymentMethodId: def.paymentMethodId ?? null,
    freq: def.freq ?? "monthly",
    month: def.month ?? 1,
    day: def.day ?? 1,
    weekday: def.weekday ?? 0,
    hour: def.hour ?? 0,
    minute: def.minute ?? 0,
    mode: def.mode ?? "notify",
    expiry: def.expiry ?? "hold",
    createdAt: Timestamp.now(),
    lastReconciledAt: last,
  });
  return ref.id;
}

// 대기 회차를 직접 만든다(reconcile 타이밍에 의존하지 않고 승인/스킵 흐름을 검증).
export async function seedOccurrence(
  uid: string,
  occ: {
    defId: string;
    occurredAt: Date;
    name: string;
    amount: number;
    type?: TxType;
    categoryId?: string | null;
    paymentMethodId?: string | null;
    status?: OccStatus;
  },
): Promise<string> {
  const id = `${occ.defId}_${occ.occurredAt.getTime()}`;
  await userRef(uid)
    .collection("occurrences")
    .doc(id)
    .set({
      defId: occ.defId,
      occurredAt: Timestamp.fromDate(occ.occurredAt),
      status: occ.status ?? "pending",
      txId: null,
      name: occ.name,
      amount: occ.amount,
      type: occ.type ?? "expense",
      categoryId: occ.categoryId ?? null,
      paymentMethodId: occ.paymentMethodId ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
  return id;
}
