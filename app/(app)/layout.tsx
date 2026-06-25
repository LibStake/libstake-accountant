import { requireSession } from "@/lib/auth/guard";
import { BottomNav, TopNav } from "./AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
