import { requireSession } from "@/lib/auth/guard";
import * as recRepo from "@/lib/recurring/repo";
import * as domRepo from "@/lib/domain/repo";
import { RecurringView } from "./RecurringView";

export default async function RecurringPage() {
  const { uid } = await requireSession();
  const [defs, pending, categories, payments] = await Promise.all([
    recRepo.listDefs(uid),
    recRepo.listPendingOccurrences(uid),
    domRepo.listCategories(uid),
    domRepo.listPayments(uid),
  ]);
  return (
    <RecurringView
      defs={defs}
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
