"use client";

import { useActionState, useMemo, useOptimistic, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { formatKst, toKstInputValue } from "@/lib/kst";
import type { TxSource, TxType } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AmountInput } from "@/components/form/AmountInput";
import { FormSelect } from "@/components/form/FormSelect";
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

const ALL = "__all__";

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

  const [optimisticTx, removeOptimistic] = useOptimistic(
    transactions,
    (state, deletedId: string) => state.filter((t) => t.id !== deletedId),
  );

  async function handleDelete(formData: FormData) {
    removeOptimistic(String(formData.get("id") ?? ""));
    await deleteTransaction(formData);
  }

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
      optimisticTx.filter((t) => {
        if (q && !t.name.toLowerCase().includes(q.toLowerCase())) return false;
        if (cat && t.categoryId !== cat) return false;
        if (pay && t.paymentMethodId !== pay) return false;
        if (type && t.type !== type) return false;
        return true;
      }),
    [optimisticTx, q, cat, pay, type],
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="icon" aria-label="이전 달">
          <Link href={`/history?m=${prevKey}`}>
            <ChevronLeft />
          </Link>
        </Button>
        <h1 className="font-semibold">{monthLabel}</h1>
        <Button asChild variant="ghost" size="icon" aria-label="다음 달">
          <Link href={`/history?m=${nextKey}`}>
            <ChevronRight />
          </Link>
        </Button>
      </div>

      <Input
        placeholder="항목명 검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="flex gap-2">
        <Select value={type || ALL} onValueChange={(v) => setType(v === ALL ? "" : (v as TxType))}>
          <SelectTrigger className="w-full flex-1" aria-label="종류 필터">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>전체</SelectItem>
            <SelectItem value="expense">지출</SelectItem>
            <SelectItem value="income">수입</SelectItem>
          </SelectContent>
        </Select>
        <Select value={cat || ALL} onValueChange={(v) => setCat(v === ALL ? "" : v)}>
          <SelectTrigger className="w-full flex-1" aria-label="카테고리 필터">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>카테고리</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={pay || ALL} onValueChange={(v) => setPay(v === ALL ? "" : v)}>
          <SelectTrigger className="w-full flex-1" aria-label="결제수단 필터">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>결제수단</SelectItem>
            {payments.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {optimisticTx.length === 0
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
              onDelete={handleDelete}
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
  onDelete,
}: {
  tx: Tx;
  categories: Opt[];
  payments: Opt[];
  catName: Map<string, string>;
  payName: Map<string, string>;
  onDelete: (formData: FormData) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: Parameters<typeof updateTransaction>[0], formData: FormData) => {
      const r = await updateTransaction(prev, formData);
      if (r.ok) {
        setEditing(false);
        toast.success("수정했어요");
      }
      return r;
    },
    null,
  );

  if (editing) {
    const fe = state && !state.ok ? state.fields : undefined;
    return (
      <li className="rounded-lg border p-3">
        <form action={action} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={tx.id} />
          <div className="flex gap-2">
            <FormSelect
              name="type"
              ariaLabel="종류"
              defaultValue={tx.type}
              className="flex-1"
              options={[
                { value: "expense", label: "지출" },
                { value: "income", label: "수입" },
              ]}
            />
            <AmountInput
              name="amount"
              defaultValue={String(tx.amount)}
              aria-label="금액"
              className="flex-1"
              required
            />
          </div>
          {fe?.amount && <p className="text-sm text-destructive">{fe.amount}</p>}
          <Input name="name" defaultValue={tx.name} maxLength={100} required />
          {fe?.name && <p className="text-sm text-destructive">{fe.name}</p>}
          <FormSelect
            name="categoryId"
            ariaLabel="카테고리"
            defaultValue={tx.categoryId ?? ""}
            emptyLabel="미분류"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
          <FormSelect
            name="paymentMethodId"
            ariaLabel="결제수단"
            defaultValue={tx.paymentMethodId ?? ""}
            emptyLabel="없음"
            options={payments.map((p) => ({ value: p.id, label: p.name }))}
          />
          <Input
            type="datetime-local"
            name="occurredAt"
            defaultValue={toKstInputValue(new Date(tx.occurredAt))}
            required
          />
          <Input name="memo" defaultValue={tx.memo ?? ""} placeholder="메모" maxLength={500} />
          {state && !state.ok && !state.fields && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={pending}>
              저장
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              취소
            </Button>
          </div>
        </form>
      </li>
    );
  }

  const sign = tx.type === "income" ? "+" : "-";
  const amountColor = tx.type === "income" ? "text-emerald-600" : "text-foreground";

  return (
    <li className="flex flex-col gap-1 rounded-lg border p-3 duration-200 animate-in fade-in-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate font-medium">{tx.name}</span>
        <span className={`shrink-0 font-semibold tabular-nums ${amountColor}`}>
          {sign}
          {tx.amount.toLocaleString("ko-KR")}원
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="min-w-0 truncate">
          {(tx.categoryId && catName.get(tx.categoryId)) || "미분류"}
          {tx.paymentMethodId && ` · ${payName.get(tx.paymentMethodId) ?? ""}`}
          {tx.source === "recurring" && " · 정기"}
          {" · "}
          {formatKst(new Date(tx.occurredAt))}
        </span>
        <span className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setEditing(true)}
          >
            수정
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" size="xs" className="text-destructive">
                삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>영구 삭제할까요?</AlertDialogTitle>
                <AlertDialogDescription>
                  {tx.name} · {tx.amount.toLocaleString("ko-KR")}원. 되돌릴 수 없어요.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <form action={onDelete}>
                  <input type="hidden" name="id" value={tx.id} />
                  <AlertDialogAction type="submit" variant="destructive" className="w-full">
                    삭제
                  </AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </span>
      </div>
      {tx.memo && <p className="text-xs text-muted-foreground/70">{tx.memo}</p>}
    </li>
  );
}
