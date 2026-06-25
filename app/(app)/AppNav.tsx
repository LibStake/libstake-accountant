"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "입력" },
  { href: "/history", label: "내역" },
  { href: "/summary", label: "요약" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function TopNav() {
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
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 border-t border-zinc-200 bg-white sm:hidden dark:border-zinc-800 dark:bg-black">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`py-3 text-center text-sm ${
            isActive(pathname, t.href) ? "font-semibold" : "text-zinc-500"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
