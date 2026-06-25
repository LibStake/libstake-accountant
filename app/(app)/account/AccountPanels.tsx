"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { PIN_LENGTH } from "@/lib/auth/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-8">
      <header>
        <h1 className="text-xl font-semibold">계정 · 보안</h1>
        <p className="text-sm text-muted-foreground">{email}</p>
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
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      toast.success("저장했어요");
    }
  }, [state]);
  useEffect(() => {
    if (removeState?.ok) toast.success("PIN을 해제했어요");
  }, [removeState]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>빠른 로그인 (PIN)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {hasPin
            ? "이 기기에 PIN이 설정돼 있어요."
            : "이 기기에 PIN을 설정하면 다음 접속 때 숫자로 빠르게 들어와요."}
        </p>
        <form ref={formRef} action={action} className="flex gap-2">
          <Input
            type="password"
            inputMode="numeric"
            pattern="\d*"
            name="pin"
            maxLength={PIN_LENGTH}
            placeholder={`숫자 ${PIN_LENGTH}자리`}
            autoComplete="off"
            required
          />
          <Button type="submit" variant="outline" disabled={pending}>
            {hasPin ? "변경" : "설정"}
          </Button>
        </form>
        {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
        {hasPin && (
          <form action={removeAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="self-start text-destructive"
              disabled={removing}
            >
              PIN 해제
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function PasswordSection({ via }: { via: "password" | "pin" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>비밀번호</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChangePassword />
        {via === "pin" && <ResetPassword />}
      </CardContent>
    </Card>
  );
}

function ChangePassword() {
  const [state, action, pending] = useActionState(changePassword, null);
  useEffect(() => {
    if (state?.ok) toast.success("변경했어요. 다른 기기의 빠른 로그인은 해제됐어요.");
  }, [state]);
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cur-pw">현재 비밀번호</Label>
        <Input id="cur-pw" type="password" name="current" autoComplete="current-password" required />
        {state && !state.ok && state.fields?.current && (
          <p className="text-sm text-destructive">{state.fields.current}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-pw">새 비밀번호 (8자 이상)</Label>
        <Input id="new-pw" type="password" name="next" autoComplete="new-password" required />
        {state && !state.ok && state.fields?.next && (
          <p className="text-sm text-destructive">{state.fields.next}</p>
        )}
      </div>
      {state && !state.ok && !state.fields && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        비밀번호 변경
      </Button>
    </form>
  );
}

function ResetPassword() {
  const [state, action, pending] = useActionState(resetPassword, null);
  useEffect(() => {
    if (state?.ok) toast.success("재설정했어요.");
  }, [state]);
  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg bg-muted/50 p-3">
      <p className="text-sm text-muted-foreground">
        현재 비밀번호가 기억나지 않나요? 이 기기는 PIN으로 신뢰됐어요 — 현재 비밀번호 없이 재설정할 수
        있어요.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-pw">새 비밀번호 (8자 이상)</Label>
        <Input id="reset-pw" type="password" name="next" autoComplete="new-password" required />
      </div>
      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" variant="outline" className="w-full" disabled={pending}>
        현재 비밀번호 없이 재설정
      </Button>
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
    <Card>
      <CardHeader>
        <CardTitle>빠른 로그인 기기</CardTitle>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <p className="text-sm text-muted-foreground">빠른 로그인 중인 기기가 없어요.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {devices.map((d) => (
              <DeviceRow key={d.deviceId} device={d} isCurrent={d.deviceId === currentDeviceId} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function DeviceRow({ device, isCurrent }: { device: DeviceItem; isCurrent: boolean }) {
  const [, action, pending] = useActionState(removeDevice, null);
  return (
    <li className="flex items-center justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate">
          {device.uaHint || "알 수 없는 기기"}
          {isCurrent && " (현재 기기)"}
        </p>
        <p className="text-xs text-muted-foreground">
          만료 {new Date(device.expiresAt).toLocaleDateString("ko-KR")}
        </p>
      </div>
      <form action={action}>
        <input type="hidden" name="deviceId" value={device.deviceId} />
        <Button type="submit" variant="ghost" size="xs" className="text-destructive" disabled={pending}>
          해제
        </Button>
      </form>
    </li>
  );
}

function DangerSection() {
  return (
    <section className="flex flex-col gap-4">
      <Separator />
      <form action={logout} className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="forgetDevice" className="size-4 accent-primary" /> 이 기기의 빠른
          로그인(PIN)도 해제
        </label>
        <Button type="submit" variant="outline" className="w-full">
          로그아웃
        </Button>
      </form>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="self-start text-destructive">
            계정 삭제
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>계정을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              계정과 모든 데이터가 영구 삭제돼요. 되돌릴 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <form action={deleteAccount}>
              <AlertDialogAction type="submit" variant="destructive" className="w-full">
                영구 삭제
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
