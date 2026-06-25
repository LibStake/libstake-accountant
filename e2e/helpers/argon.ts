import { hash } from "@node-rs/argon2";
import { requireEnv } from "./env";

// 앱의 hashPassword/hashPin과 동일한 알고리즘·페퍼로 해시를 만들어 시드 유저/기기가
// 실제 로그인·PIN 검증을 통과하게 한다.
export function hashPassword(password: string): Promise<string> {
  return hash(password, { secret: new TextEncoder().encode(requireEnv("PASSWORD_PEPPER")) });
}

export function hashPin(pin: string): Promise<string> {
  return hash(pin, { secret: new TextEncoder().encode(requireEnv("PIN_PEPPER")) });
}
