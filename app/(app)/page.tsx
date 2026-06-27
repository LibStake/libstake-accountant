import { requireSession } from "@/lib/auth/guard";
import * as repo from "@/lib/domain/repo";
import { reconcileOnce } from "@/lib/recurring/reconcile";
import { EntryForm } from "./EntryForm";

export default async function EntryPage() {
  const { uid } = await requireSession();
  // 폼 입력 옵션은 재조정과 무관하므로 즉시 병렬로 가져온다.
  const form = Promise.all([
    repo.listCategories(uid),
    repo.listPayments(uid),
    repo.getDefaultPaymentId(uid),
  ]).then(([categories, payments, defaultPaymentId]) => ({
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
    payments: payments.map((p) => ({ id: p.id, name: p.name })),
    defaultPaymentId,
  }));
  // 최근 입력은 재조정으로 실체화된 정기 거래까지 반영하도록 재조정 후 읽는다.
  const recent = reconcileOnce(uid)
    .then(() => repo.listRecentTransactions(uid, 3))
    .then((rows) =>
      rows.map((t) => ({ id: t.id, name: t.name, amount: t.amount, type: t.type })),
    )
    .catch(() => []);
  return <EntryForm form={form} recent={recent} />;
}
