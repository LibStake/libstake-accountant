"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, null);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">가입</h1>
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">이메일</Label>
          <Input id="email" type="email" name="email" autoComplete="username" required />
          {state && !state.ok && state.fields?.email && (
            <p className="text-sm text-destructive">{state.fields.email}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">비밀번호 (8자 이상)</Label>
          <Input
            id="password"
            type="password"
            name="password"
            autoComplete="new-password"
            required
          />
          {state && !state.ok && state.fields?.password && (
            <p className="text-sm text-destructive">{state.fields.password}</p>
          )}
        </div>
        {state && !state.ok && !state.fields && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "처리 중…" : "가입하기"}
        </Button>
      </form>
      <Link href="/login" className="text-sm text-muted-foreground underline">
        로그인으로
      </Link>
    </main>
  );
}
