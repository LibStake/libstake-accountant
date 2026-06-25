import Link from "next/link";
import { requireSession } from "@/lib/auth/guard";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Link href="/" className="font-semibold">
          가계부
        </Link>
        <Link href="/account" className="text-sm text-zinc-500 underline">
          계정
        </Link>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
