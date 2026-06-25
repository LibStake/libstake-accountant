import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "@/lib/server/firebase";

const USERS = "users";
const EMAIL_INDEX = "emailIndex";
const DEVICES = "devices";

const DAY_MS = 24 * 60 * 60 * 1000;

export type UserRecord = { uid: string; emailLower: string; passwordHash: string };

export type DeviceState = { pinHash: string; failCount: number; expiresAt: Date };

export type DeviceListItem = {
  deviceId: string;
  uaHint: string;
  lastUsedAt: Date | null;
  expiresAt: Date;
};

class EmailTakenError extends Error {}

function devicesCol(uid: string) {
  return db().collection(USERS).doc(uid).collection(DEVICES);
}

function deviceRef(uid: string, deviceId: string) {
  return devicesCol(uid).doc(deviceId);
}

// 이메일 유일성을 트랜잭션으로 보장하며 user + emailIndex를 함께 만든다.
// 이미 쓰는 이메일이면 null.
export async function createUser(
  emailLower: string,
  passwordHash: string,
): Promise<UserRecord | null> {
  const firestore = db();
  const userRef = firestore.collection(USERS).doc();
  const indexRef = firestore.collection(EMAIL_INDEX).doc(emailLower);
  try {
    await firestore.runTransaction(async (tx) => {
      if ((await tx.get(indexRef)).exists) throw new EmailTakenError();
      tx.set(userRef, {
        emailLower,
        passwordHash,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(indexRef, { uid: userRef.id });
    });
  } catch (e) {
    if (e instanceof EmailTakenError) return null;
    throw e;
  }
  return { uid: userRef.id, emailLower, passwordHash };
}

export async function findUserByEmail(
  emailLower: string,
): Promise<UserRecord | null> {
  const index = await db().collection(EMAIL_INDEX).doc(emailLower).get();
  if (!index.exists) return null;
  const uid = index.get("uid") as string;
  const user = await db().collection(USERS).doc(uid).get();
  if (!user.exists) return null;
  return { uid, emailLower, passwordHash: user.get("passwordHash") as string };
}

export async function getPasswordHash(uid: string): Promise<string | null> {
  const user = await db().collection(USERS).doc(uid).get();
  return user.exists ? (user.get("passwordHash") as string) : null;
}

export async function setPasswordHash(
  uid: string,
  passwordHash: string,
): Promise<void> {
  await db().collection(USERS).doc(uid).update({ passwordHash });
}

export async function getEmail(uid: string): Promise<string | null> {
  const user = await db().collection(USERS).doc(uid).get();
  return user.exists ? (user.get("emailLower") as string) : null;
}

export async function createDevice(
  uid: string,
  pinHash: string,
  uaHint: string,
  ttlDays: number,
): Promise<string> {
  const ref = devicesCol(uid).doc();
  await ref.set({
    pinHash,
    failCount: 0,
    uaHint,
    createdAt: FieldValue.serverTimestamp(),
    lastUsedAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + ttlDays * DAY_MS),
  });
  return ref.id;
}

export async function updateDevicePin(
  uid: string,
  deviceId: string,
  pinHash: string,
  ttlDays: number,
): Promise<void> {
  await deviceRef(uid, deviceId).update({
    pinHash,
    failCount: 0,
    lastUsedAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + ttlDays * DAY_MS),
  });
}

export async function getDevice(
  uid: string,
  deviceId: string,
): Promise<DeviceState | null> {
  const snap = await deviceRef(uid, deviceId).get();
  if (!snap.exists) return null;
  return {
    pinHash: snap.get("pinHash") as string,
    failCount: snap.get("failCount") as number,
    expiresAt: (snap.get("expiresAt") as Timestamp).toDate(),
  };
}

export async function incrementDeviceFail(
  uid: string,
  deviceId: string,
): Promise<void> {
  await deviceRef(uid, deviceId).update({ failCount: FieldValue.increment(1) });
}

export async function resetDeviceFail(
  uid: string,
  deviceId: string,
): Promise<void> {
  await deviceRef(uid, deviceId).update({
    failCount: 0,
    lastUsedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteDevice(
  uid: string,
  deviceId: string,
): Promise<void> {
  await deviceRef(uid, deviceId).delete();
}

export async function deleteOtherDevices(
  uid: string,
  keepDeviceId: string | null,
): Promise<void> {
  const snap = await devicesCol(uid).get();
  await Promise.all(
    snap.docs.filter((d) => d.id !== keepDeviceId).map((d) => d.ref.delete()),
  );
}

export async function listDevices(uid: string): Promise<DeviceListItem[]> {
  const snap = await devicesCol(uid).get();
  return snap.docs.map((d) => ({
    deviceId: d.id,
    uaHint: (d.get("uaHint") as string) ?? "",
    lastUsedAt: (d.get("lastUsedAt") as Timestamp | undefined)?.toDate() ?? null,
    expiresAt: (d.get("expiresAt") as Timestamp).toDate(),
  }));
}

// ! - 사용자의 모든 하위 데이터(기기 등)까지 영구 삭제한다. 되돌릴 수 없다.
export async function deleteUserCompletely(
  uid: string,
  emailLower: string,
): Promise<void> {
  const firestore = db();
  await firestore.recursiveDelete(firestore.collection(USERS).doc(uid));
  await firestore.collection(EMAIL_INDEX).doc(emailLower).delete();
}
