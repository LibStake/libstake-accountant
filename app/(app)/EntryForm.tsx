"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ui } from "@/lib/ui";
import { toKstInputValue } from "@/lib/kst";
import { createTransaction } from "./actions";

type Opt = { id: string; name: string };

export function EntryForm({
  categories,
  payments,
  defaultPaymentId,
}: {
  categories: Opt[];
  payments: Opt[];
  defaultPaymentId: string | null;
}) {
  const [state, action, pending] = useActionState(createTransaction, null);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(defaultPaymentId ?? "");
  const [memo, setMemo] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [toast, setToast] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  // 발생일시 기본값 = 현재(KST). 마운트 후 채워 하이드레이션 불일치를 피한다.
  useEffect(() => {
    setOccurredAt(toKstInputValue(new Date()));
  }, []);

  // 저장 성공 시 폼을 즉시 비워 다음 입력에 대비한다.
  useEffect(() => {
    if (!state?.ok) return;
    setAmount("");
    setName("");
    setCategoryId("");
    setMemo("");
    setPaymentMethodId(defaultPaymentId ?? "");
    setType("expense");
    setOccurredAt(toKstInputValue(new Date()));
    setToast(true);
    amountRef.current?.focus();
    const t = setTimeout(() => setToast(false), 2000);
    return () => clearTimeout(t);
  }, [state, defaultPaymentId]);

  const fieldErr = state && !state.ok ? state.fields : undefined;

  return (
    <form action={action} className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-8">
      <div className="flex gap-2" role="group" aria-label="종류">
        <SegBtn active={type === "expense"} onClick={() => setType("expense")}>
          지출
        </SegBtn>
        <SegBtn active={type === "income"} onClick={() => setType("income")}>
          수입
        </SegBtn>
      </div>
      <input type="hidden" name="type" value={type} />

      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-500">금액</span>
        <input
          ref={amountRef}
          className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-3 text-3xl font-semibold tabular-nums outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100"
          name="amount"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
          required
        />
      </label>
      {fieldErr?.amount && <p className={ui.alert}>{fieldErr.amount}</p>}

      <label className={ui.label}>
        지출명
        <input
          className={ui.input}
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
        />
      </label>
      {fieldErr?.name && <p className={ui.alert}>{fieldErr.name}</p>}

      <label className={ui.label}>
        카테고리
        <select
          className={ui.input}
          name="categoryId"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">미분류</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className={ui.label}>
        결제수단
        <select
          className={ui.input}
          name="paymentMethodId"
          value={paymentMethodId}
          onChange={(e) => setPaymentMethodId(e.target.value)}
        >
          <option value="">없음</option>
          {payments.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className={ui.label}>
        발생일시
        <input
          className={ui.input}
          type="datetime-local"
          name="occurredAt"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          required
        />
      </label>

      <label className={ui.label}>
        메모 (선택)
        <input
          className={ui.input}
          name="memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          maxLength={500}
        />
      </label>

      {state && !state.ok && !state.fields && <p className={ui.alert}>{state.error}</p>}

      <button className={ui.button} disabled={pending}>
        {pending ? "저장 중…" : "저장"}
      </button>

      {toast && (
        <p
          role="status"
          className="fixed inset-x-0 bottom-20 mx-auto w-fit rounded-full bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          저장했어요
        </p>
      )}
    </form>
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
