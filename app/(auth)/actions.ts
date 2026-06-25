"use server";

import { redirect } from "next/navigation";
import { loginInput, signupInput, pinInput, fieldErrors } from "@/lib/validation/auth";
import * as repo from "@/lib/auth/repo";
import { seedCategories } from "@/lib/domain/repo";
import { DEFAULT_CATEGORIES } from "@/lib/domain/defaults";
import { hashPassword, verifyPassword, verifyPin } from "@/lib/auth/hash";
import { issueSession } from "@/lib/auth/session";
import { readDeviceToken, clearDeviceToken } from "@/lib/auth/device";
import { fail, type Result } from "@/lib/server/result";
import { PIN_MAX_FAIL } from "@/lib/auth/constants";

type State = Result<null> | null;

const LOGIN_ERROR = "이메일 또는 비밀번호가 올바르지 않아요.";
const FAST_LOGIN_EXPIRED = "빠른 로그인이 만료됐어요. 다시 로그인해주세요.";

export async function signup(_prev: State, formData: FormData): Promise<Result<null>> {
  const parsed = signupInput.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return fail("입력을 확인해주세요.", fieldErrors(parsed.error));
  const user = await repo.createUser(parsed.data.email, await hashPassword(parsed.data.password));
  // 계정 존재 비노출 — 이미 쓰는 이메일이어도 구체 사유를 밝히지 않는다.
  if (!user) return fail("가입을 완료하지 못했어요. 입력을 확인하고 다시 시도해주세요.");
  await seedCategories(user.uid, DEFAULT_CATEGORIES);
  await issueSession(user.uid, "password");
  redirect("/");
}

export async function login(_prev: State, formData: FormData): Promise<Result<null>> {
  const parsed = loginInput.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return fail(LOGIN_ERROR);
  const user = await repo.findUserByEmail(parsed.data.email);
  if (!user) return fail(LOGIN_ERROR);
  if (!(await verifyPassword(user.passwordHash, parsed.data.password))) return fail(LOGIN_ERROR);
  await issueSession(user.uid, "password");
  redirect("/");
}

export async function pinUnlock(_prev: State, formData: FormData): Promise<Result<null>> {
  const device = await readDeviceToken();
  if (!device) return fail(FAST_LOGIN_EXPIRED);
  const parsed = pinInput.safeParse({ pin: formData.get("pin") });
  if (!parsed.success) return fail("PIN을 확인해주세요.");
  const state = await repo.getDevice(device.uid, device.deviceId);
  if (!state || state.expiresAt.getTime() < Date.now()) {
    await clearDeviceToken();
    return fail(FAST_LOGIN_EXPIRED);
  }
  if (!(await verifyPin(state.pinHash, parsed.data.pin))) {
    if (state.failCount + 1 > PIN_MAX_FAIL) {
      await repo.deleteDevice(device.uid, device.deviceId);
      await clearDeviceToken();
      return fail("PIN을 여러 번 틀려 빠른 로그인이 해제됐어요. 다시 로그인해주세요.");
    }
    await repo.incrementDeviceFail(device.uid, device.deviceId);
    return fail("PIN이 올바르지 않아요.");
  }
  await repo.resetDeviceFail(device.uid, device.deviceId);
  await issueSession(device.uid, "pin");
  redirect("/");
}
