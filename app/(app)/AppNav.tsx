"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "입력" },
  { href: "/history", label: "내역" },
  { href: "/recurring", label: "정기" },
  { href: "/summary", label: "요약" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Badge({ n }: { n: number }) {
  return (
    <span className="ml-1 inline-flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] leading-4 text-white">
      {n}
    </span>
  );
}

export function TopNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  return (
    <header className="hidden items-center gap-6 border-b border-zinc-200 px-4 py-3 sm:flex dark:border-zinc-800">
      <span className="font-semibold">가계부</span>
      <nav className="flex gap-4 text-sm">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={isActive(pathname, t.href) ? "font-semibold" : "text-zinc-500"}
          >
            {t.label}
            {t.href === "/recurring" && pendingCount > 0 && <Badge n={pendingCount} />}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function BottomNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-zinc-200 bg-white sm:hidden dark:border-zinc-800 dark:bg-black">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`py-3 text-center text-sm ${
            isActive(pathname, t.href) ? "font-semibold" : "text-zinc-500"
          }`}
        >
          {t.label}
          {t.href === "/recurring" && pendingCount > 0 && <Badge n={pendingCount} />}
        </Link>
      ))}
    </nav>
  );
}
