import { requireSession } from "@/lib/auth/guard";
import { reconcile } from "@/lib/recurring/reconcile";
import * as repo from "@/lib/domain/repo";
import {
  addDay,
  addMonth,
  dateKey,
  dayRange,
  monthRange,
  nowYearMonth,
  nowYearMonthDay,
  parseDateKey,
  parseYear,
  parseYearMonthKey,
  yearMonthKey,
  yearRange,
  type YearMonthDay,
} from "@/lib/kst";
import { HistoryView, type HistoryUnit } from "./HistoryView";

function parseUnit(u: string | undefined): HistoryUnit {
  return u === "month" || u === "year" ? u : "day";
}

// 단위별로 조회 범위·현재 키·이전/다음 키·표시 라벨과, 단위 전환 시 머무를 기준일(anchor)을 푼다.
function resolvePeriod(unit: HistoryUnit, key: string | undefined) {
  if (unit === "month") {
    const ym = parseYearMonthKey(key ?? "") ?? nowYearMonth();
    return {
      range: monthRange(ym),
      periodKey: yearMonthKey(ym),
      prevKey: yearMonthKey(addMonth(ym, -1)),
      nextKey: yearMonthKey(addMonth(ym, 1)),
      label: `${ym.year}년 ${ym.month}월`,
      anchor: { year: ym.year, month: ym.month, day: 1 },
    };
  }
  if (unit === "year") {
    const year = parseYear(key ?? "") ?? nowYearMonthDay().year;
    return {
      range: yearRange(year),
      periodKey: String(year),
      prevKey: String(year - 1),
      nextKey: String(year + 1),
      label: `${year}년`,
      anchor: { year, month: 1, day: 1 },
    };
  }
  const ymd = parseDateKey(key ?? "") ?? nowYearMonthDay();
  return {
    range: dayRange(ymd),
    periodKey: dateKey(ymd),
    prevKey: dateKey(addDay(ymd, -1)),
    nextKey: dateKey(addDay(ymd, 1)),
    label: `${ymd.year}년 ${ymd.month}월 ${ymd.day}일`,
    anchor: ymd,
  };
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; d?: string }>;
}) {
  const { uid } = await requireSession();
  // 자동 모드가 실체화한 거래를 읽기 전에 채운다(layout reconcile과의 동시 렌더 레이스 방지).
  await reconcile(uid);
  const sp = await searchParams;
  const unit = parseUnit(sp.u);
  const period = resolvePeriod(unit, sp.d);
  const anchor: YearMonthDay = period.anchor;
  const [transactions, categories, payments] = await Promise.all([
    repo.listTransactionsInRange(uid, period.range),
    repo.listCategories(uid),
    repo.listPayments(uid, { includeArchived: true }),
  ]);
  return (
    <HistoryView
      unit={unit}
      periodLabel={period.label}
      periodKey={period.periodKey}
      prevKey={period.prevKey}
      nextKey={period.nextKey}
      dayKey={dateKey(anchor)}
      monthKey={yearMonthKey(anchor)}
      yearKey={String(anchor.year)}
      transactions={transactions.map((t) => ({
        id: t.id,
        name: t.name,
        amount: t.amount,
        type: t.type,
        categoryId: t.categoryId,
        paymentMethodId: t.paymentMethodId,
        occurredAt: t.occurredAt.toISOString(),
        memo: t.memo,
        source: t.source,
      }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      payments={payments.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
