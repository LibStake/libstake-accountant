import { requireSession } from "@/lib/auth/guard";
import { readDeviceToken } from "@/lib/auth/device";
import * as repo from "@/lib/auth/repo";
import { AccountPanels } from "./AccountPanels";

export default async function AccountPage() {
  const session = await requireSession();
  const device = await readDeviceToken();
  let hasPin = false;
  if (device && device.uid === session.uid) {
    const state = await repo.getDevice(device.uid, device.deviceId);
    hasPin = repo.isDeviceActive(state);
  }
  const devices = await repo.listDevices(session.uid);
  const email = (await repo.getEmail(session.uid)) ?? "";
  return (
    <AccountPanels
      email={email}
      via={session.via}
      hasPin={hasPin}
      currentDeviceId={device?.deviceId ?? null}
      devices={devices.map((d) => ({
        deviceId: d.deviceId,
        uaHint: d.uaHint,
        expiresAt: d.expiresAt.toISOString(),
      }))}
    />
  );
}
