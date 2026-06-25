import { requireSession } from "@/lib/auth/guard";
import { reconcile } from "@/lib/recurring/reconcile";
import { countPending } from "@/lib/recurring/repo";
import { BottomNav, TopNav } from "./AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { uid } = await requireSession();
  await reconcile(uid);
  const pendingCount = await countPending(uid);
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav pendingCount={pendingCount} />
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <BottomNav pendingCount={pendingCount} />
    </div>
  );
}
