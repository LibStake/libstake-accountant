import { requireSession } from "@/lib/auth/guard";
import { reconcile } from "@/lib/recurring/reconcile";
import { enumerateOccurrences } from "@/lib/recurring/schedule";
import * as recRepo from "@/lib/recurring/repo";
import * as domRepo from "@/lib/domain/repo";
import { RecurringView } from "./RecurringView";

const HORIZON_MS = 366 * 24 * 60 * 60 * 1000;

export default async function RecurringPage() {
  const { uid } = await requireSession();
  // 도래분을 읽기 전에 채운다. layout reconcile과 동시 렌더되어도 자기 호출 후 커밋을 본다.
  await reconcile(uid);
  const [defs, pending, categories, payments] = await Promise.all([
    recRepo.listDefs(uid),
    recRepo.listPendingOccurrences(uid),
    domRepo.listCategories(uid),
    domRepo.listPayments(uid),
  ]);
  const now = new Date();
  const horizon = new Date(now.getTime() + HORIZON_MS);
  return (
    <RecurringView
      defs={defs.map((d) => ({
        ...d,
        nextAt: (enumerateOccurrences(d, now, horizon)[0] ?? horizon).toISOString(),
      }))}
      pending={pending.map((o) => ({
        id: o.id,
        name: o.name,
        amount: o.amount,
        type: o.type,
        occurredAt: o.occurredAt.toISOString(),
      }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      payments={payments.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
