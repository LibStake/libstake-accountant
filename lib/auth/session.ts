import "server-only";
import { cookies } from "next/headers";
import { cookieOptions, signToken, verifyToken } from "./jwt";
import { SESSION_TTL_DAYS } from "./constants";

const COOKIE = "session";

type Via = "password" | "pin";
export type Session = { uid: string; via: Via };

export async function issueSession(uid: string, via: Via): Promise<void> {
  const token = await signToken(uid, { via }, SESSION_TTL_DAYS);
  (await cookies()).set(COOKIE, token, cookieOptions(SESSION_TTL_DAYS));
}

export async function readSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.sub) return null;
  return { uid: payload.sub, via: payload.via === "pin" ? "pin" : "password" };
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
