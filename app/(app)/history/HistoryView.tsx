"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ui } from "@/lib/ui";
import { formatKst, toKstInputValue } from "@/lib/kst";
import type { TxSource, TxType } from "@/lib/domain/types";
import { deleteTransaction, updateTransaction } from "./actions";

type Tx = {
  id: string;
  name: string;
  amount: number;
  type: TxType;
  categoryId: string | null;
  paymentMethodId: string | null;
  occurredAt: string;
  memo: string | null;
  source: TxSource;
};
type Opt = { id: string; name: string };

export function HistoryView({
  monthLabel,
  prevKey,
  nextKey,
  transactions,
  categories,
  payments,
}: {
  monthLabel: string;
  prevKey: string;
  nextKey: string;
  transactions: Tx[];
  categories: Opt[];
  payments: Opt[];
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [pay, setPay] = useState("");
  const [type, setType] = useState<"" | TxType>("");

  const catName = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );
  const payName = useMemo(
    () => new Map(payments.map((p) => [p.id, p.name])),
    [payments],
  );

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        if (q && !t.name.toLowerCase().includes(q.toLowerCase())) return false;
        if (cat && t.categoryId !== cat) return false;
        if (pay && t.paymentMethodId !== pay) return false;
        if (type && t.type !== type) return false;
        return true;
      }),
    [transactions, q, cat, pay, type],
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between">
        <Link href={`/history?m=${prevKey}`} className="px-3 py-1 text-zinc-500" aria-label="이전 달">
          ←
        </Link>
        <h1 className="font-semibold">{monthLabel}</h1>
        <Link href={`/history?m=${nextKey}`} className="px-3 py-1 text-zinc-500" aria-label="다음 달">
          →
        </Link>
      </div>

      <input
        className={ui.input}
        placeholder="지출명 검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="flex gap-2">
        <select
          className={ui.input}
          value={type}
          onChange={(e) => setType(e.target.value as "" | TxType)}
          aria-label="종류 필터"
        >
          <option value="">전체</option>
          <option value="expense">지출</option>
          <option value="income">수입</option>
        </select>
        <select
          className={ui.input}
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          aria-label="카테고리 필터"
        >
          <option value="">카테고리</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className={ui.input}
          value={pay}
          onChange={(e) => setPay(e.target.value)}
          aria-label="결제수단 필터"
        >
          <option value="">결제수단</option>
          {payments.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">
          {transactions.length === 0
            ? "이 달엔 거래가 없어요. 입력에서 기록해보세요."
            : "조건에 맞는 거래가 없어요."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((t) => (
            <Row
              key={t.id}
              tx={t}
              categories={categories}
              payments={payments}
              catName={catName}
              payName={payName}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({
  tx,
  categories,
  payments,
  catName,
  payName,
}: {
  tx: Tx;
  categories: Opt[];
  payments: Opt[];
  catName: Map<string, string>;
  payName: Map<string, string>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(updateTransaction, null);
  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);

  if (editing) {
    const fe = state && !state.ok ? state.fields : undefined;
    return (
      <li className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <form action={action} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={tx.id} />
          <div className="flex gap-2">
            <select name="type" defaultValue={tx.type} className={ui.input}>
              <option value="expense">지출</option>
              <option value="income">수입</option>
            </select>
            <input
              name="amount"
              defaultValue={String(tx.amount)}
              inputMode="numeric"
              className={ui.input}
              required
            />
          </div>
          {fe?.amount && <p className={ui.alert}>{fe.amount}</p>}
          <input name="name" defaultValue={tx.name} className={ui.input} maxLength={100} required />
          {fe?.name && <p className={ui.alert}>{fe.name}</p>}
          <select name="categoryId" defaultValue={tx.categoryId ?? ""} className={ui.input}>
            <option value="">미분류</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select name="paymentMethodId" defaultValue={tx.paymentMethodId ?? ""} className={ui.input}>
            <option value="">없음</option>
            {payments.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            name="occurredAt"
            defaultValue={toKstInputValue(new Date(tx.occurredAt))}
            className={ui.input}
            required
          />
          <input
            name="memo"
            defaultValue={tx.memo ?? ""}
            placeholder="메모"
            className={ui.input}
            maxLength={500}
          />
          {state && !state.ok && !state.fields && <p className={ui.alert}>{state.error}</p>}
          <div className="flex gap-2">
            <button className={ui.button} disabled={pending}>
              저장
            </button>
            <button type="button" className={ui.ghost} onClick={() => setEditing(false)}>
              취소
            </button>
          </div>
        </form>
      </li>
    );
  }

  const sign = tx.type === "income" ? "+" : "-";
  const amountColor =
    tx.type === "income" ? "text-emerald-600" : "text-zinc-900 dark:text-zinc-100";

  return (
    <li className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate font-medium">{tx.name}</span>
        <span className={`shrink-0 font-semibold tabular-nums ${amountColor}`}>
          {sign}
          {tx.amount.toLocaleString("ko-KR")}원
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
        <span className="min-w-0 truncate">
          {(tx.categoryId && catName.get(tx.categoryId)) || "미분류"}
          {tx.paymentMethodId && ` · ${payName.get(tx.paymentMethodId) ?? ""}`}
          {tx.source === "recurring" && " · 정기"}
          {" · "}
          {formatKst(new Date(tx.occurredAt))}
        </span>
        <span className="flex shrink-0 gap-2">
          <button type="button" className="underline" onClick={() => setEditing(true)}>
            수정
          </button>
          <button
            type="button"
            className="text-red-600 underline"
            onClick={() => setConfirming(true)}
          >
            삭제
          </button>
        </span>
      </div>
      {tx.memo && <p className="text-xs text-zinc-400">{tx.memo}</p>}
      {confirming && (
        <form
          action={deleteTransaction}
          className="mt-1 flex items-center gap-2 rounded-lg bg-red-50 p-2 text-sm dark:bg-red-950/30"
        >
          <input type="hidden" name="id" value={tx.id} />
          <span>영구 삭제할까요?</span>
          <button className={ui.danger}>삭제</button>
          <button type="button" className={ui.ghost} onClick={() => setConfirming(false)}>
            취소
          </button>
        </form>
      )}
    </li>
  );
}
