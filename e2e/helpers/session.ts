import { SignJWT } from "jose";
import { SESSION_TTL_DAYS, DEVICE_TTL_DAYS } from "../../lib/auth/constants";
import { requireEnv } from "./env";

const ALG = "HS256";

function key(): Uint8Array {
  return new TextEncoder().encode(requireEnv("JWT_SECRET"));
}

// 앱의 issueSession과 동일한 클레임 모양을 jose로 복제한다(server-only 모듈 import 회피).
export function mintSession(uid: string, via: "password" | "pin" = "password"): Promise<string> {
  return new SignJWT({ via })
    .setProtectedHeader({ alg: ALG })
    .setSubject(uid)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(key());
}

export function mintDevice(uid: string, deviceId: string): Promise<string> {
  return new SignJWT({ did: deviceId })
    .setProtectedHeader({ alg: ALG })
    .setSubject(uid)
    .setIssuedAt()
    .setExpirationTime(`${DEVICE_TTL_DAYS}d`)
    .sign(key());
}
