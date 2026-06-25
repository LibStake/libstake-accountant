"use client";

import { useActionState, useState } from "react";
import { ui } from "@/lib/ui";
import { PIN_LENGTH } from "@/lib/auth/constants";
import {
  changePassword,
  deleteAccount,
  logout,
  removeDevice,
  removePin,
  resetPassword,
  setPin,
} from "./actions";

type DeviceItem = { deviceId: string; uaHint: string; expiresAt: string };

export function AccountPanels({
  email,
  via,
  hasPin,
  devices,
  currentDeviceId,
}: {
  email: string;
  via: "password" | "pin";
  hasPin: boolean;
  devices: DeviceItem[];
  currentDeviceId: string | null;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-6 py-8">
      <header>
        <h1 className="text-xl font-semibold">계정 · 보안</h1>
        <p className="text-sm text-zinc-500">{email}</p>
      </header>
      <PinSection hasPin={hasPin} />
      <PasswordSection via={via} />
      <DeviceSection devices={devices} currentDeviceId={currentDeviceId} />
      <DangerSection />
    </div>
  );
}

function PinSection({ hasPin }: { hasPin: boolean }) {
  const [state, action, pending] = useActionState(setPin, null);
  const [removeState, removeAction, removing] = useActionState(removePin, null);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-medium">빠른 로그인 (PIN)</h2>
      <p className="text-sm text-zinc-500">
        {hasPin
          ? "이 기기에 PIN이 설정돼 있어요."
          : "이 기기에 PIN을 설정하면 다음 접속 때 숫자로 빠르게 들어와요."}
      </p>
      <form action={action} className="flex gap-2">
        <input
          className={ui.input}
          type="password"
          inputMode="numeric"
          pattern="\d*"
          name="pin"
          maxLength={PIN_LENGTH}
          placeholder={`숫자 ${PIN_LENGTH}자리`}
          autoComplete="off"
          required
        />
        <button className={`${ui.ghost} whitespace-nowrap`} disabled={pending}>
          {hasPin ? "변경" : "설정"}
        </button>
      </form>
      {state && !state.ok && <p className={ui.alert}>{state.error}</p>}
      {state?.ok && <p className={ui.ok}>저장했어요.</p>}
      {hasPin && (
        <form action={removeAction}>
          <button className="self-start text-sm text-red-600 underline" disabled={removing}>
            PIN 해제
          </button>
        </form>
      )}
      {removeState?.ok && <p className={ui.ok}>해제했어요.</p>}
    </section>
  );
}

function PasswordSection({ via }: { via: "password" | "pin" }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-medium">비밀번호</h2>
      <ChangePassword />
      {via === "pin" && <ResetPassword />}
    </section>
  );
}

function ChangePassword() {
  const [state, action, pending] = useActionState(changePassword, null);
  return (
    <form action={action} className="flex flex-col gap-2">
      <label className={ui.label}>
        현재 비밀번호
        <input
          className={ui.input}
          type="password"
          name="current"
          autoComplete="current-password"
          required
        />
      </label>
      {state && !state.ok && state.fields?.current && (
        <p className={ui.alert}>{state.fields.current}</p>
      )}
      <label className={ui.label}>
        새 비밀번호 (8자 이상)
        <input
          className={ui.input}
          type="password"
          name="next"
          autoComplete="new-password"
          required
        />
      </label>
      {state && !state.ok && state.fields?.next && (
        <p className={ui.alert}>{state.fields.next}</p>
      )}
      {state && !state.ok && !state.fields && <p className={ui.alert}>{state.error}</p>}
      {state?.ok && <p className={ui.ok}>변경했어요. 다른 기기의 빠른 로그인은 해제됐어요.</p>}
      <button className={ui.button} disabled={pending}>
        비밀번호 변경
      </button>
    </form>
  );
}

function ResetPassword() {
  const [state, action, pending] = useActionState(resetPassword, null);
  return (
    <form
      action={action}
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
    >
      <p className="text-sm text-zinc-500">
        현재 비밀번호가 기억나지 않나요? 이 기기는 PIN으로 신뢰됐어요 — 현재 비밀번호 없이
        재설정할 수 있어요.
      </p>
      <label className={ui.label}>
        새 비밀번호 (8자 이상)
        <input
          className={ui.input}
          type="password"
          name="next"
          autoComplete="new-password"
          required
        />
      </label>
      {state && !state.ok && <p className={ui.alert}>{state.error}</p>}
      {state?.ok && <p className={ui.ok}>재설정했어요.</p>}
      <button className={ui.ghost} disabled={pending}>
        현재 비밀번호 없이 재설정
      </button>
    </form>
  );
}

function DeviceSection({
  devices,
  currentDeviceId,
}: {
  devices: DeviceItem[];
  currentDeviceId: string | null;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-medium">빠른 로그인 기기</h2>
      {devices.length === 0 ? (
        <p className="text-sm text-zinc-500">빠른 로그인 중인 기기가 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {devices.map((d) => (
            <DeviceRow
              key={d.deviceId}
              device={d}
              isCurrent={d.deviceId === currentDeviceId}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function DeviceRow({ device, isCurrent }: { device: DeviceItem; isCurrent: boolean }) {
  const [, action, pending] = useActionState(removeDevice, null);
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
      <div className="min-w-0">
        <p className="truncate">
          {device.uaHint || "알 수 없는 기기"}
          {isCurrent && " (현재 기기)"}
        </p>
        <p className="text-xs text-zinc-500">
          만료 {new Date(device.expiresAt).toLocaleDateString("ko-KR")}
        </p>
      </div>
      <form action={action}>
        <input type="hidden" name="deviceId" value={device.deviceId} />
        <button className="text-red-600 underline" disabled={pending}>
          해제
        </button>
      </form>
    </li>
  );
}

function DangerSection() {
  const [confirming, setConfirming] = useState(false);
  return (
    <section className="flex flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <form action={logout} className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-zinc-500">
          <input type="checkbox" name="forgetDevice" /> 이 기기의 빠른 로그인(PIN)도 해제
        </label>
        <button className={ui.ghost}>로그아웃</button>
      </form>
      {!confirming ? (
        <button
          type="button"
          className="self-start text-sm text-red-600 underline"
          onClick={() => setConfirming(true)}
        >
          계정 삭제
        </button>
      ) : (
        <form
          action={deleteAccount}
          className="flex flex-col gap-2 rounded-lg border border-red-300 p-3"
        >
          <p className="text-sm">계정과 모든 데이터가 영구 삭제돼요. 되돌릴 수 없어요.</p>
          <div className="flex gap-2">
            <button className={ui.danger}>영구 삭제</button>
            <button
              type="button"
              className={ui.ghost}
              onClick={() => setConfirming(false)}
            >
              취소
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
