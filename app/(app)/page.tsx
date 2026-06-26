import { requireSession } from "@/lib/auth/guard";
import * as repo from "@/lib/domain/repo";
import { EntryForm } from "./EntryForm";

export default async function EntryPage() {
  const { uid } = await requireSession();
  const [categories, payments, defaultPaymentId, recent] = await Promise.all([
    repo.listCategories(uid),
    repo.listPayments(uid),
    repo.getDefaultPaymentId(uid),
    repo.listRecentTransactions(uid, 3),
  ]);
  return (
    <EntryForm
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      payments={payments.map((p) => ({ id: p.id, name: p.name }))}
      defaultPaymentId={defaultPaymentId}
      recent={recent.map((t) => ({
        id: t.id,
        name: t.name,
        amount: t.amount,
        type: t.type,
        occurredAt: t.occurredAt.toISOString(),
      }))}
    />
  );
}
