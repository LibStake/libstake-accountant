import { z } from "zod";

// zod 검증 실패를 필드별 메시지로 — 클라이언트가 필드 옆에 표시한다.
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) out[key] = issue.message;
  }
  return out;
}
