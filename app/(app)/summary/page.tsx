import { requireSession } from "@/lib/auth/guard";
import { reconcile } from "@/lib/recurring/reconcile";
import * as repo from "@/lib/domain/repo";
import {
  addMonth,
  monthRange,
  nowYearMonth,
  parseYearMonthKey,
  yearMonthKey,
} from "@/lib/kst";
import { SummaryView } from "./SummaryView";

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { uid } = await requireSession();
  // 자동 모드가 실체화한 거래를 집계하기 전에 채운다(layout reconcile과의 동시 렌더 레이스 방지).
  await reconcile(uid);
  const sp = await searchParams;
  const ym = parseYearMonthKey(sp.m ?? "") ?? nowYearMonth();
  const [txns, categories] = await Promise.all([
    repo.listMonthTransactions(uid, monthRange(ym)),
    repo.listCategories(uid),
  ]);

  let totalExpense = 0;
  let totalIncome = 0;
  const sums = new Map<string, { expense: number; income: number }>();
  for (const t of txns) {
    if (t.type === "expense") totalExpense += t.amount;
    else totalIncome += t.amount;
    const key = t.categoryId ?? "__none__";
    const s = sums.get(key) ?? { expense: 0, income: 0 };
    s[t.type] += t.amount;
    sums.set(key, s);
  }

  const rows: { name: string; expense: number; income: number }[] = [];
  for (const c of categories) {
    const s = sums.get(c.id);
    if (s) rows.push({ name: c.name, expense: s.expense, income: s.income });
  }
  const none = sums.get("__none__");
  if (none) rows.push({ name: "미분류", expense: none.expense, income: none.income });

  return (
    <SummaryView
      monthLabel={`${ym.year}년 ${ym.month}월`}
      prevKey={yearMonthKey(addMonth(ym, -1))}
      nextKey={yearMonthKey(addMonth(ym, 1))}
      totalExpense={totalExpense}
      totalIncome={totalIncome}
      rows={rows}
      hasData={txns.length > 0}
    />
  );
}
