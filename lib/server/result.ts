// 서버 경계의 일관된 응답 형태. 클라이언트는 error를 비차단 안내로,
// fields를 필드별 오류로 표현한다.
export type Ok<T> = { ok: true; data: T };
export type Fail = { ok: false; error: string; fields?: Record<string, string> };
export type Result<T> = Ok<T> | Fail;

export function ok<T>(data: T): Ok<T> {
  return { ok: true, data };
}

export function fail(error: string, fields?: Record<string, string>): Fail {
  return { ok: false, error, fields };
}
