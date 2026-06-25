import type { Freq } from "@/lib/domain/types";

// KST(UTC+9, DST 없음) 기준으로 도래 결제일시를 산출한다.
const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export type Schedule = {
  freq: Freq;
  month: number; // 1-12 (연간)
  day: number; // 1-31 (연간·월간)
  weekday: number; // 0-6 (주간, 0=일)
  hour: number; // 0-23
  minute: number; // 0-59
};

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// KST 벽시계(y, mo, d, h, mi) → 절대 시각.
function kstInstant(y: number, mo: number, d: number, h: number, mi: number): Date {
  return new Date(Date.UTC(y, mo - 1, d, h, mi) - KST_OFFSET_MS);
}

// (fromExclusive, toInclusive] 구간에 도래하는 결제일시들. 말일 클램프 포함.
export function enumerateOccurrences(
  s: Schedule,
  fromExclusive: Date,
  toInclusive: Date,
): Date[] {
  const out: Date[] = [];
  if (toInclusive <= fromExclusive) return out;

  // KST 날짜 단위로 순회한다. cursor는 KST 자정을 UTC 벽시계로 표현한 값.
  const fromK = new Date(fromExclusive.getTime() + KST_OFFSET_MS);
  const toK = new Date(toInclusive.getTime() + KST_OFFSET_MS);
  let cursor = Date.UTC(fromK.getUTCFullYear(), fromK.getUTCMonth(), fromK.getUTCDate());
  const lastDay = Date.UTC(toK.getUTCFullYear(), toK.getUTCMonth(), toK.getUTCDate());

  for (; cursor <= lastDay; cursor += DAY_MS) {
    const c = new Date(cursor);
    const y = c.getUTCFullYear();
    const mo = c.getUTCMonth() + 1;
    const d = c.getUTCDate();
    const wd = c.getUTCDay();

    let match: boolean;
    if (s.freq === "daily") match = true;
    else if (s.freq === "weekly") match = wd === s.weekday;
    else if (s.freq === "monthly") match = d === Math.min(s.day, daysInMonth(y, mo));
    else match = mo === s.month && d === Math.min(s.day, daysInMonth(y, mo));

    if (!match) continue;
    const inst = kstInstant(y, mo, d, s.hour, s.minute);
    if (inst > fromExclusive && inst <= toInclusive) out.push(inst);
  }
  return out;
}
