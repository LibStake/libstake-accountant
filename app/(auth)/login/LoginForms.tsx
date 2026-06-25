"use client";

import { useActionState, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { OTPInputContext, REGEXP_ONLY_DIGITS } from "input-otp";
import { login, pinUnlock } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { PIN_LENGTH } from "@/lib/auth/constants";

function MaskedSlot({ index }: { index: number }) {
  const ctx = useContext(OTPInputContext);
  const slot = ctx?.slots[index];
  return (
    <div
      data-active={slot?.isActive}
      className={cn(
        "relative flex size-12 items-center justify-center border-y border-r border-input text-lg transition-all first:rounded-l-lg first:border-l last:rounded-r-lg data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-3 data-[active=true]:ring-ring/50 dark:bg-input/30",
      )}
    >
      {slot?.char ? <span className="size-2.5 rounded-full bg-foreground" /> : null}
      {slot?.hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
}

export function LoginForms({ hasFastLogin }: { hasFastLogin: boolean }) {
  const [mode, setMode] = useState<"pin" | "full">(hasFastLogin ? "pin" : "full");
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-6 py-12">
      <h1 className="text-2xl font-semibold">가계부</h1>
      {mode === "pin" ? (
        <div className="flex flex-col gap-6">
          <PinUnlock />
          <button
            type="button"
            className="mx-auto text-sm text-muted-foreground underline"
            onClick={() => setMode("full")}
          >
            일반 로그인으로
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <FullLogin />
          <div className="flex justify-between text-sm text-muted-foreground">
            {hasFastLogin && (
              <button type="button" className="underline" onClick={() => setMode("pin")}>
                PIN으로
              </button>
            )}
            <Link className="underline" href="/signup">
              가입하기
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

function FullLogin() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">이메일</Label>
        <Input id="email" type="email" name="email" autoComplete="username" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "확인 중…" : "로그인"}
      </Button>
    </form>
  );
}

function PinUnlock() {
  const [pin, setPin] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    async (prev: Parameters<typeof pinUnlock>[0], formData: FormData) => {
      const r = await pinUnlock(prev, formData);
      if (!r.ok) setPin("");
      return r;
    },
    null,
  );

  useEffect(() => {
    if (pin.length === PIN_LENGTH) formRef.current?.requestSubmit();
  }, [pin]);

  return (
    <form action={action} ref={formRef} className="flex flex-col items-center gap-6">
      <input type="hidden" name="pin" value={pin} />
      <InputOTP
        maxLength={PIN_LENGTH}
        value={pin}
        onChange={setPin}
        pattern={REGEXP_ONLY_DIGITS}
        disabled={pending}
        autoFocus
        containerClassName="justify-center"
        aria-label="PIN"
      >
        <InputOTPGroup>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <MaskedSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
