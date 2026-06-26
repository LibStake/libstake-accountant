"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

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
  const fill = type === "income" ? "bg-emerald-600" : "bg-primary";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="icon" aria-label="이전 달">
          <Link href={`/summary?m=${prevKey}`}>
            <ChevronLeft />
          </Link>
        </Button>
        <h1 className="font-semibold">{monthLabel}</h1>
        <Button asChild variant="ghost" size="icon" aria-label="다음 달">
          <Link href={`/summary?m=${nextKey}`}>
            <ChevronRight />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card size="sm">
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">총지출</p>
            <p className="text-lg font-semibold tabular-nums">{won(totalExpense)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">총수입</p>
            <p className="text-lg font-semibold tabular-nums text-emerald-600">
              {won(totalIncome)}
            </p>
          </CardContent>
        </Card>
      </div>
      <p className="text-sm text-muted-foreground">
        순{" "}
        <span
          className={`font-medium tabular-nums ${net < 0 ? "text-foreground" : "text-emerald-600"}`}
        >
          {won(net)}
        </span>
      </p>

      <ToggleGroup
        type="single"
        value={type}
        onValueChange={(v) => v && setType(v as "expense" | "income")}
        variant="outline"
        spacing={0}
        className="w-full"
      >
        <ToggleGroupItem
          value="expense"
          className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          지출
        </ToggleGroupItem>
        <ToggleGroupItem
          value="income"
          className="flex-1 data-[state=on]:bg-emerald-600 data-[state=on]:text-white"
        >
          수입
        </ToggleGroupItem>
      </ToggleGroup>

      {!hasData ? (
        <p className="py-12 text-center text-sm text-muted-foreground">이 달엔 거래가 없어요.</p>
      ) : sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
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
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-2 rounded-full transition-[width] duration-500 ${fill}`}
                  style={{ width: `${max ? (r[type] / max) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
