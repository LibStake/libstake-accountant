// KST(UTC+9, DST 없음) 고정. 저장은 절대 시각, 월 경계·표시·입력 해석은 KST 기준.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// month는 1-12.
export type YearMonth = { year: number; month: number };

export function nowYearMonth(): YearMonth {
  return dateToYearMonth(new Date());
}

export function dateToYearMonth(d: Date): YearMonth {
  const k = new Date(d.getTime() + KST_OFFSET_MS);
  return { year: k.getUTCFullYear(), month: k.getUTCMonth() + 1 };
}

// 해당 KST 월의 [start, end) 절대 시각 경계.
export function monthRange(ym: YearMonth): { start: Date; end: Date } {
  const start = new Date(Date.UTC(ym.year, ym.month - 1, 1) - KST_OFFSET_MS);
  const next = addMonth(ym, 1);
  const end = new Date(Date.UTC(next.year, next.month - 1, 1) - KST_OFFSET_MS);
  return { start, end };
}

export function addMonth(ym: YearMonth, delta: number): YearMonth {
  const idx = ym.year * 12 + (ym.month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

export function yearMonthKey(ym: YearMonth): string {
  return `${ym.year}-${String(ym.month).padStart(2, "0")}`;
}

export function parseYearMonthKey(key: string): YearMonth | null {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year: Number(m[1]), month };
}

// 절대 시각 → datetime-local 표시값 "YYYY-MM-DDTHH:mm"(KST 벽시계).
export function toKstInputValue(d: Date): string {
  return new Date(d.getTime() + KST_OFFSET_MS).toISOString().slice(0, 16);
}

// datetime-local 입력(KST 벽시계로 해석) → 절대 시각.
export function fromKstInputValue(s: string): Date {
  return new Date(new Date(`${s}:00Z`).getTime() - KST_OFFSET_MS);
}

// 표시용 "YYYY.MM.DD HH:mm"(KST).
export function formatKst(d: Date): string {
  const k = new Date(d.getTime() + KST_OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${k.getUTCFullYear()}.${p(k.getUTCMonth() + 1)}.${p(k.getUTCDate())} ${p(k.getUTCHours())}:${p(k.getUTCMinutes())}`;
}
