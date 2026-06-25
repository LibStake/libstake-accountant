"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { login, pinUnlock } from "../actions";
import { ui } from "@/lib/ui";
import { PIN_LENGTH } from "@/lib/auth/constants";

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
            className="text-sm text-zinc-500 underline"
            onClick={() => setMode("full")}
          >
            일반 로그인으로
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <FullLogin />
          <div className="flex justify-between text-sm text-zinc-500">
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
    <form action={action} className="flex flex-col gap-3">
      <label className={ui.label}>
        이메일
        <input className={ui.input} type="email" name="email" autoComplete="username" required />
      </label>
      <label className={ui.label}>
        비밀번호
        <input
          className={ui.input}
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state && !state.ok && (
        <p role="alert" className={ui.alert}>
          {state.error}
        </p>
      )}
      <button className={ui.button} disabled={pending}>
        {pending ? "확인 중…" : "로그인"}
      </button>
    </form>
  );
}

function PinUnlock() {
  const [state, action, pending] = useActionState(pinUnlock, null);
  const [pin, setPin] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (pin.length === PIN_LENGTH) formRef.current?.requestSubmit();
  }, [pin]);
  useEffect(() => {
    if (state && !state.ok) setPin("");
  }, [state]);

  const push = (d: string) => setPin((p) => (p.length < PIN_LENGTH ? p + d : p));
  const back = () => setPin((p) => p.slice(0, -1));

  return (
    <form action={action} ref={formRef} className="flex flex-col items-center gap-6">
      <input type="hidden" name="pin" value={pin} />
      <div className="flex gap-3" role="status" aria-label={`PIN ${pin.length}자리 입력됨`}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full ${
              i < pin.length ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          />
        ))}
      </div>
      {state && !state.ok && (
        <p role="alert" className={ui.alert}>
          {state.error}
        </p>
      )}
      <div className="grid w-full max-w-xs grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => push(d)}
            disabled={pending}
            className="rounded-lg bg-zinc-100 py-4 text-xl disabled:opacity-50 dark:bg-zinc-800"
          >
            {d}
          </button>
        ))}
        <span />
        <button
          type="button"
          onClick={() => push("0")}
          disabled={pending}
          className="rounded-lg bg-zinc-100 py-4 text-xl disabled:opacity-50 dark:bg-zinc-800"
        >
          0
        </button>
        <button
          type="button"
          onClick={back}
          disabled={pending}
          aria-label="지우기"
          className="rounded-lg bg-zinc-100 py-4 text-xl disabled:opacity-50 dark:bg-zinc-800"
        >
          ⌫
        </button>
      </div>
    </form>
  );
}
