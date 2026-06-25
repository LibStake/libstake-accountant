"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "../actions";
import { ui } from "@/lib/ui";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, null);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">가입</h1>
      <form action={action} className="flex flex-col gap-3">
        <label className={ui.label}>
          이메일
          <input className={ui.input} type="email" name="email" autoComplete="username" required />
        </label>
        {state && !state.ok && state.fields?.email && (
          <p className={ui.alert}>{state.fields.email}</p>
        )}
        <label className={ui.label}>
          비밀번호 (8자 이상)
          <input
            className={ui.input}
            type="password"
            name="password"
            autoComplete="new-password"
            required
          />
        </label>
        {state && !state.ok && state.fields?.password && (
          <p className={ui.alert}>{state.fields.password}</p>
        )}
        {state && !state.ok && !state.fields && (
          <p role="alert" className={ui.alert}>
            {state.error}
          </p>
        )}
        <button className={ui.button} disabled={pending}>
          {pending ? "처리 중…" : "가입하기"}
        </button>
      </form>
      <Link href="/login" className="text-sm text-zinc-500 underline">
        로그인으로
      </Link>
    </main>
  );
}
