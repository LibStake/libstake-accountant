import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/guard";
import { readDeviceToken } from "@/lib/auth/device";
import * as repo from "@/lib/auth/repo";
import { LoginForms } from "./LoginForms";

export default async function LoginPage() {
  if (await getSession()) redirect("/");
  const device = await readDeviceToken();
  let hasFastLogin = false;
  if (device) {
    const state = await repo.getDevice(device.uid, device.deviceId);
    hasFastLogin = repo.isDeviceActive(state);
  }
  return <LoginForms hasFastLogin={hasFastLogin} />;
}
