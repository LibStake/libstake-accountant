import "server-only";
import { hash, verify } from "@node-rs/argon2";
import { env } from "@/lib/server/env";

// 알고리즘 옵션을 생략하면 라이브러리 기본값(Argon2id)을 쓴다.
// 페퍼는 secret으로 주입한다 — 해시 문자열에 저장되지 않으므로 검증 시에도 같이 넘긴다.
function pepper(seed: string): Uint8Array {
  return new TextEncoder().encode(seed);
}

export function hashPassword(password: string): Promise<string> {
  return hash(password, { secret: pepper(env.passwordPepper) });
}

export function verifyPassword(hashed: string, password: string): Promise<boolean> {
  return verify(hashed, password, { secret: pepper(env.passwordPepper) });
}

export function hashPin(pin: string): Promise<string> {
  return hash(pin, { secret: pepper(env.pinPepper) });
}

export function verifyPin(hashed: string, pin: string): Promise<boolean> {
  return verify(hashed, pin, { secret: pepper(env.pinPepper) });
}
