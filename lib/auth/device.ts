import "server-only";
import { cookies } from "next/headers";
import { cookieOptions, signToken, verifyToken } from "./jwt";
import { DEVICE_TTL_DAYS } from "./constants";

const COOKIE = "device";

export type DeviceRef = { uid: string; deviceId: string };

export async function issueDeviceToken(ref: DeviceRef): Promise<void> {
  const token = await signToken(ref.uid, { did: ref.deviceId }, DEVICE_TTL_DAYS);
  (await cookies()).set(COOKIE, token, cookieOptions(DEVICE_TTL_DAYS));
}

export async function readDeviceToken(): Promise<DeviceRef | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.sub || typeof payload.did !== "string") return null;
  return { uid: payload.sub, deviceId: payload.did };
}

export async function clearDeviceToken(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
