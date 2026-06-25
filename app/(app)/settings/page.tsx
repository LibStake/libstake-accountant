import { requireSession } from "@/lib/auth/guard";
import * as repo from "@/lib/domain/repo";
import { SettingsPanels } from "./SettingsPanels";

export default async function SettingsPage() {
  const { uid } = await requireSession();
  const [categories, payments, defaultPaymentId] = await Promise.all([
    repo.listCategories(uid),
    repo.listPayments(uid, { includeArchived: true }),
    repo.getDefaultPaymentId(uid),
  ]);
  const [catCounts, payCounts] = await Promise.all([
    Promise.all(categories.map((c) => repo.countCategoryUsage(uid, c.id))),
    Promise.all(payments.map((p) => repo.countPaymentUsage(uid, p.id))),
  ]);
  return (
    <SettingsPanels
      categories={categories.map((c, i) => ({
        id: c.id,
        name: c.name,
        usage: catCounts[i],
      }))}
      payments={payments.map((p, i) => ({
        id: p.id,
        name: p.name,
        kind: p.kind,
        archived: p.archived,
        usage: payCounts[i],
      }))}
      defaultPaymentId={defaultPaymentId}
    />
  );
}
