"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Row = { name: string; expense: number; income: number };

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export function SummaryView({
  monthLabel,
  prevKey,
  nextKey,
  totalExpense,
  totalIncome,
  rows,
  hasData,
}: {
  monthLabel: string;
  prevKey: string;
  nextKey: string;
  totalExpense: number;
  totalIncome: number;
  rows: Row[];
  hasData: boolean;
}) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const sorted = useMemo(
    () => rows.filter((r) => r[type] > 0).sort((a, b) => b[type] - a[type]),
    [rows, type],
  );
  const max = sorted.length ? sorted[0][type] : 0;
  const net = totalIncome - totalExpense;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <Link href={`/summary?m=${prevKey}`} className="px-3 py-1 text-zinc-500" aria-label="이전 달">
          ←
        </Link>
        <h1 className="font-semibold">{monthLabel}</h1>
        <Link href={`/summary?m=${nextKey}`} className="px-3 py-1 text-zinc-500" aria-label="다음 달">
          →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">총지출</p>
          <p className="text-lg font-semibold tabular-nums">{won(totalExpense)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">총수입</p>
          <p className="text-lg font-semibold tabular-nums text-emerald-600">
            {won(totalIncome)}
          </p>
        </div>
      </div>
      <p className="text-sm text-zinc-500">
        순{" "}
        <span
          className={`font-medium tabular-nums ${
            net < 0 ? "text-zinc-900 dark:text-zinc-100" : "text-emerald-600"
          }`}
        >
          {won(net)}
        </span>
      </p>

      <div className="flex gap-2">
        <SegBtn active={type === "expense"} onClick={() => setType("expense")}>
          지출
        </SegBtn>
        <SegBtn active={type === "income"} onClick={() => setType("income")}>
          수입
        </SegBtn>
      </div>

      {!hasData ? (
        <p className="py-12 text-center text-sm text-zinc-500">이 달엔 거래가 없어요.</p>
      ) : sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          {type === "expense" ? "지출" : "수입"}이 없어요.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((r) => (
            <li key={r.name} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span className="min-w-0 truncate">{r.name}</span>
                <span className="shrink-0 tabular-nums">{won(r[type])}</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-2 rounded-full bg-zinc-900 dark:bg-zinc-100"
                  style={{ width: `${max ? (r[type] / max) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <nav className="flex flex-col gap-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
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

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg py-2 text-sm font-medium ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}
