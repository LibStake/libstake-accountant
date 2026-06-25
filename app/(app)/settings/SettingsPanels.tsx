"use client";

import { useActionState, useEffect, useState } from "react";
import { ui } from "@/lib/ui";
import type { PaymentKind } from "@/lib/domain/types";
import {
  addCategory,
  addPayment,
  archivePayment,
  deleteCategory,
  deletePayment,
  moveCategory,
  movePayment,
  renameCategory,
  renamePayment,
  setDefaultPayment,
} from "./actions";

type Cat = { id: string; name: string; usage: number };
type Pay = {
  id: string;
  name: string;
  kind: PaymentKind;
  archived: boolean;
  usage: number;
};

type VoidAction = (formData: FormData) => void | Promise<void>;

export function SettingsPanels({
  categories,
  payments,
  defaultPaymentId,
}: {
  categories: Cat[];
  payments: Pay[];
  defaultPaymentId: string | null;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-10 px-6 py-8">
      <h1 className="text-xl font-semibold">관리</h1>
      <CategorySection categories={categories} />
      <PaymentSection payments={payments} defaultPaymentId={defaultPaymentId} />
    </div>
  );
}

function MoveButtons({
  id,
  index,
  total,
  action,
}: {
  id: string;
  index: number;
  total: number;
  action: VoidAction;
}) {
  return (
    <>
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="dir" value="up" />
        <button className="px-1 disabled:opacity-30" disabled={index === 0} aria-label="위로">
          ▲
        </button>
      </form>
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="dir" value="down" />
        <button
          className="px-1 disabled:opacity-30"
          disabled={index === total - 1}
          aria-label="아래로"
        >
          ▼
        </button>
      </form>
    </>
  );
}

/* ── 카테고리 ── */

function CategorySection({ categories }: { categories: Cat[] }) {
  const [state, action, pending] = useActionState(addCategory, null);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-medium">카테고리</h2>
      <ul className="flex flex-col gap-2">
        {categories.map((c, i) => (
          <CategoryRow key={c.id} cat={c} index={i} total={categories.length} />
        ))}
      </ul>
      <form action={action} className="flex gap-2">
        <input className={ui.input} name="name" placeholder="새 카테고리" maxLength={40} required />
        <button className={`${ui.ghost} whitespace-nowrap`} disabled={pending}>
          추가
        </button>
      </form>
      {state && !state.ok && <p className={ui.alert}>{state.error}</p>}
    </section>
  );
}

function CategoryRow({ cat, index, total }: { cat: Cat; index: number; total: number }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(renameCategory, null);
  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      {editing ? (
        <form action={action} className="flex gap-2">
          <input type="hidden" name="id" value={cat.id} />
          <input
            className={ui.input}
            name="name"
            defaultValue={cat.name}
            maxLength={40}
            required
            autoFocus
          />
          <button className={`${ui.ghost} whitespace-nowrap`} disabled={pending}>
            저장
          </button>
          <button type="button" className={ui.ghost} onClick={() => setEditing(false)}>
            취소
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate">{cat.name}</span>
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <MoveButtons id={cat.id} index={index} total={total} action={moveCategory} />
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
          </div>
        </div>
      )}
      {state && !state.ok && <p className={ui.alert}>{state.error}</p>}
      {confirming && (
        <form
          action={deleteCategory}
          className="flex flex-col gap-2 rounded-lg bg-red-50 p-2 text-sm dark:bg-red-950/30"
        >
          <input type="hidden" name="id" value={cat.id} />
          <p>
            {cat.usage > 0
              ? `이 카테고리를 쓰는 거래 ${cat.usage}건의 분류가 비워져요.`
              : "이 카테고리를 삭제할까요?"}
          </p>
          <div className="flex gap-2">
            <button className={ui.danger}>삭제</button>
            <button type="button" className={ui.ghost} onClick={() => setConfirming(false)}>
              취소
            </button>
          </div>
        </form>
      )}
    </li>
  );
}

/* ── 결제수단 ── */

function PaymentSection({
  payments,
  defaultPaymentId,
}: {
  payments: Pay[];
  defaultPaymentId: string | null;
}) {
  const [state, action, pending] = useActionState(addPayment, null);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-medium">결제수단</h2>
      <ul className="flex flex-col gap-2">
        {payments.map((p, i) => (
          <PaymentRow
            key={p.id}
            pay={p}
            index={i}
            total={payments.length}
            isDefault={p.id === defaultPaymentId}
          />
        ))}
      </ul>
      <form action={action} className="flex gap-2">
        <input className={ui.input} name="name" placeholder="새 결제수단" maxLength={40} required />
        <select className={ui.input} name="kind" defaultValue="card" aria-label="종류">
          <option value="card">카드</option>
          <option value="account">계좌</option>
        </select>
        <button className={`${ui.ghost} whitespace-nowrap`} disabled={pending}>
          추가
        </button>
      </form>
      {state && !state.ok && <p className={ui.alert}>{state.error}</p>}
    </section>
  );
}

function PaymentRow({
  pay,
  index,
  total,
  isDefault,
}: {
  pay: Pay;
  index: number;
  total: number;
  isDefault: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(renamePayment, null);
  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      {editing ? (
        <form action={action} className="flex gap-2">
          <input type="hidden" name="id" value={pay.id} />
          <input type="hidden" name="kind" value={pay.kind} />
          <input
            className={ui.input}
            name="name"
            defaultValue={pay.name}
            maxLength={40}
            required
            autoFocus
          />
          <button className={`${ui.ghost} whitespace-nowrap`} disabled={pending}>
            저장
          </button>
          <button type="button" className={ui.ghost} onClick={() => setEditing(false)}>
            취소
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate">{pay.name}</span>
            <span className="text-xs text-zinc-400">
              {pay.kind === "card" ? "카드" : "계좌"}
            </span>
            {isDefault && (
              <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900">
                기본
              </span>
            )}
            {pay.archived && <span className="text-xs text-zinc-400">보관됨</span>}
          </div>
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <MoveButtons id={pay.id} index={index} total={total} action={movePayment} />
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
          </div>
        </div>
      )}
      {!editing && (
        <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
          {!pay.archived && !isDefault && (
            <form action={setDefaultPayment}>
              <input type="hidden" name="paymentId" value={pay.id} />
              <button className="underline">기본으로</button>
            </form>
          )}
          {isDefault && (
            <form action={setDefaultPayment}>
              <input type="hidden" name="paymentId" value="" />
              <button className="underline">기본 해제</button>
            </form>
          )}
          <form action={archivePayment}>
            <input type="hidden" name="id" value={pay.id} />
            <input type="hidden" name="archived" value={pay.archived ? "0" : "1"} />
            <button className="underline">{pay.archived ? "복원" : "보관"}</button>
          </form>
        </div>
      )}
      {state && !state.ok && <p className={ui.alert}>{state.error}</p>}
      {confirming && (
        <form
          action={deletePayment}
          className="flex flex-col gap-2 rounded-lg bg-red-50 p-2 text-sm dark:bg-red-950/30"
        >
          <input type="hidden" name="id" value={pay.id} />
          <p>
            {pay.usage > 0
              ? `이 결제수단을 쓰는 거래 ${pay.usage}건의 결제수단이 비워져요.`
              : "이 결제수단을 삭제할까요?"}
          </p>
          <div className="flex gap-2">
            <button className={ui.danger}>삭제</button>
            <button type="button" className={ui.ghost} onClick={() => setConfirming(false)}>
              취소
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
