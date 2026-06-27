import { requireSession } from "@/lib/auth/guard";
import { reconcileOnce } from "@/lib/recurring/reconcile";
import { countPending } from "@/lib/recurring/repo";
import { BottomNav, TopNav } from "./AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { uid } = await requireSession();
  // 셸은 즉시 그리고, 재조정 후 대기 수를 읽어 정확한 배지를 배경에서 흘려보낸다(첫 페인트 비차단).
  const pendingCount = reconcileOnce(uid)
    .then(() => countPending(uid))
    .catch(() => 0);
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
