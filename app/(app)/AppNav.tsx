"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PencilLine, PieChart, ReceiptText, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const TABS = [
  { href: "/", label: "입력", icon: PencilLine },
  { href: "/history", label: "내역", icon: ReceiptText },
  { href: "/recurring", label: "정기", icon: Repeat },
  { href: "/summary", label: "요약", icon: PieChart },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function CountBadge({ n, className }: { n: number; className?: string }) {
  return (
    <Badge
      className={cn(
        "h-4 min-w-4 justify-center rounded-full border-transparent bg-red-600 px-1 text-[10px] leading-none text-white",
        className,
      )}
    >
      {n}
    </Badge>
  );
}

export function TopNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  return (
    <header className="hidden items-center gap-6 border-b px-4 py-3 sm:flex">
      <span className="font-semibold">가계부</span>
      <nav className="flex gap-4 text-sm">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "inline-flex items-center transition-colors",
              isActive(pathname, t.href)
                ? "font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.href === "/recurring" && pendingCount > 0 && (
              <CountBadge n={pendingCount} className="ml-1" />
            )}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function BottomNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t bg-background sm:hidden">
      {TABS.map((t) => {
        const active = isActive(pathname, t.href);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 text-[11px] transition-colors",
              active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <span className="relative">
              <Icon className="size-5" />
              {t.href === "/recurring" && pendingCount > 0 && (
                <CountBadge n={pendingCount} className="absolute -top-1.5 -right-2.5" />
              )}
            </span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
