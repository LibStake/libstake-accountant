import "server-only";
import { redirect } from "next/navigation";
import { readSession, type Session } from "./session";

export async function getSession(): Promise<Session | null> {
  return readSession();
}

// ! - 세션이 없으면 /login으로 리다이렉트하며 호출자에게 돌아오지 않는다.
export async function requireSession(): Promise<Session> {
  const session = await readSession();
  if (!session) redirect("/login");
  return session;
}
