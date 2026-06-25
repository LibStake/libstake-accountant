import Link from "next/link";

export default function SummaryPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-8">
      <h1 className="text-xl font-semibold">요약</h1>
      <p className="text-sm text-zinc-500">월간 집계 자리.</p>
      <nav className="flex flex-col gap-2">
        <Link
          href="/settings"
          className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
        >
          관리 (카테고리 · 결제수단)
        </Link>
        <Link
          href="/account"
          className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
        >
          계정 · 보안
        </Link>
      </nav>
    </div>
  );
}
