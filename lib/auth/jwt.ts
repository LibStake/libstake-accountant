import "server-only";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { env } from "@/lib/server/env";

const ALG = "HS256";
const DAY_SECONDS = 24 * 60 * 60;

function key(): Uint8Array {
  return new TextEncoder().encode(env.jwtSecret);
}

export async function signToken(
  subject: string,
  claims: JWTPayload,
  ttlDays: number,
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: ALG })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(`${ttlDays}d`)
    .sign(key());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: [ALG] });
    return payload;
  } catch {
    return null;
  }
}

export function cookieOptions(ttlDays: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ttlDays * DAY_SECONDS,
  };
}
