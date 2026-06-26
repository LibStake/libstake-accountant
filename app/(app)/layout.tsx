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
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopNav pendingCount={pendingCount} />
      <main className="min-h-0 flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">
        {children}
      </main>
      <BottomNav pendingCount={pendingCount} />
    </div>
  );
}
