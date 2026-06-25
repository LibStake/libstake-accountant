"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/guard";
import * as repo from "@/lib/auth/repo";
import { hashPassword, hashPin, verifyPassword } from "@/lib/auth/hash";
import { clearSession } from "@/lib/auth/session";
import { clearDeviceToken, issueDeviceToken, readDeviceToken } from "@/lib/auth/device";
import { fail, ok, type Result } from "@/lib/server/result";
import {
  fieldErrors,
  passwordChangeInput,
  passwordResetInput,
  pinInput,
} from "@/lib/validation/auth";
import { DEVICE_TTL_DAYS } from "@/lib/auth/constants";

type State = Result<null> | null;

const NEED_LOGIN = "로그인이 필요해요.";
const ACCOUNT_PATH = "/account";

// 비밀번호 교체 후 현재 기기를 제외한 다른 기기의 빠른 로그인을 모두 해제한다.
async function applyNewPassword(uid: string, next: string): Promise<void> {
  await repo.setPasswordHash(uid, await hashPassword(next));
  const current = await readDeviceToken();
  const keep = current && current.uid === uid ? current.deviceId : null;
  await repo.deleteOtherDevices(uid, keep);
}

export async function setPin(_prev: State, formData: FormData): Promise<Result<null>> {
  const session = await getSession();
  if (!session) return fail(NEED_LOGIN);
  const parsed = pinInput.safeParse({ pin: formData.get("pin") });
  if (!parsed.success) return fail(fieldErrors(parsed.error).pin ?? "PIN을 확인해주세요.");
  const pinHash = await hashPin(parsed.data.pin);
  const ua = (await headers()).get("user-agent") ?? "";

  let reuseId: string | null = null;
  const existing = await readDeviceToken();
  if (existing && existing.uid === session.uid) {
    if (await repo.getDevice(existing.uid, existing.deviceId)) reuseId = existing.deviceId;
  }
  if (reuseId) {
    await repo.updateDevicePin(session.uid, reuseId, pinHash, DEVICE_TTL_DAYS);
    await issueDeviceToken({ uid: session.uid, deviceId: reuseId });
  } else {
    const deviceId = await repo.createDevice(session.uid, pinHash, ua, DEVICE_TTL_DAYS);
    await issueDeviceToken({ uid: session.uid, deviceId });
  }
  revalidatePath(ACCOUNT_PATH);
  return ok(null);
}

export async function removePin(_prev: State, _formData: FormData): Promise<Result<null>> {
  const session = await getSession();
  if (!session) return fail(NEED_LOGIN);
  const device = await readDeviceToken();
  if (device && device.uid === session.uid) {
    await repo.deleteDevice(device.uid, device.deviceId);
    await clearDeviceToken();
  }
  revalidatePath(ACCOUNT_PATH);
  return ok(null);
}

export async function changePassword(_prev: State, formData: FormData): Promise<Result<null>> {
  const session = await getSession();
  if (!session) return fail(NEED_LOGIN);
  const parsed = passwordChangeInput.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
  });
  if (!parsed.success) return fail("입력을 확인해주세요.", fieldErrors(parsed.error));
  const hash = await repo.getPasswordHash(session.uid);
  if (!hash) return fail(NEED_LOGIN);
  if (!(await verifyPassword(hash, parsed.data.current)))
    return fail("현재 비밀번호가 올바르지 않아요.", { current: "현재 비밀번호가 올바르지 않아요." });
  await applyNewPassword(session.uid, parsed.data.next);
  revalidatePath(ACCOUNT_PATH);
  return ok(null);
}

export async function resetPassword(_prev: State, formData: FormData): Promise<Result<null>> {
  const session = await getSession();
  if (!session) return fail(NEED_LOGIN);
  if (session.via !== "pin")
    return fail("이 동작은 빠른 로그인(PIN)으로 들어온 기기에서만 할 수 있어요.");
  const parsed = passwordResetInput.safeParse({ next: formData.get("next") });
  if (!parsed.success) return fail("입력을 확인해주세요.", fieldErrors(parsed.error));
  await applyNewPassword(session.uid, parsed.data.next);
  revalidatePath(ACCOUNT_PATH);
  return ok(null);
}

export async function removeDevice(_prev: State, formData: FormData): Promise<Result<null>> {
  const session = await getSession();
  if (!session) return fail(NEED_LOGIN);
  const deviceId = String(formData.get("deviceId") ?? "");
  if (!deviceId) return fail("잘못된 요청이에요.");
  await repo.deleteDevice(session.uid, deviceId);
  const current = await readDeviceToken();
  if (current && current.uid === session.uid && current.deviceId === deviceId)
    await clearDeviceToken();
  revalidatePath(ACCOUNT_PATH);
  return ok(null);
}

export async function logout(formData: FormData): Promise<void> {
  if (formData.get("forgetDevice")) {
    const device = await readDeviceToken();
    if (device) {
      await repo.deleteDevice(device.uid, device.deviceId);
      await clearDeviceToken();
    }
  }
  await clearSession();
  redirect("/login");
}

export async function deleteAccount(): Promise<void> {
  const session = await getSession();
  if (session) {
    const email = await repo.getEmail(session.uid);
    if (email) await repo.deleteUserCompletely(session.uid, email);
  }
  await clearSession();
  await clearDeviceToken();
  redirect("/login");
}
