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
import { HistoryView } from "./HistoryView";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { uid } = await requireSession();
  // 자동 모드가 실체화한 거래를 읽기 전에 채운다(layout reconcile과의 동시 렌더 레이스 방지).
  await reconcile(uid);
  const sp = await searchParams;
  const ym = parseYearMonthKey(sp.m ?? "") ?? nowYearMonth();
  const [transactions, categories, payments] = await Promise.all([
    repo.listMonthTransactions(uid, monthRange(ym)),
    repo.listCategories(uid),
    repo.listPayments(uid, { includeArchived: true }),
  ]);
  return (
    <HistoryView
      monthLabel={`${ym.year}년 ${ym.month}월`}
      prevKey={yearMonthKey(addMonth(ym, -1))}
      nextKey={yearMonthKey(addMonth(ym, 1))}
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
