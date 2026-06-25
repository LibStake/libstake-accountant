"use client";

import { useActionState, useEffect, useState } from "react";
import { ui } from "@/lib/ui";
import { formatKst } from "@/lib/kst";
import type { Freq, RecurMode, RecurringDef, TxType } from "@/lib/domain/types";
import type { Result } from "@/lib/server/result";
import {
  approveOccurrence,
  createRecurring,
  deleteRecurring,
  skipOccurrence,
  updateRecurring,
} from "./actions";

type Opt = { id: string; name: string };
type Pending = { id: string; name: string; amount: number; type: TxType; occurredAt: string };
type FormAction = (prev: Result<null> | null, fd: FormData) => Promise<Result<null>>;

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n: number) => String(n).padStart(2, "0");
const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

function describe(d: RecurringDef): string {
  const t = `${pad(d.hour)}:${pad(d.minute)}`;
  if (d.freq === "daily") return `매일 ${t}`;
  if (d.freq === "weekly") return `매주 ${WEEKDAYS[d.weekday]} ${t}`;
  if (d.freq === "monthly") return `매월 ${d.day}일 ${t}`;
  return `매년 ${d.month}월 ${d.day}일 ${t}`;
}

export function RecurringView({
  defs,
  pending,
  categories,
  payments,
}: {
  defs: RecurringDef[];
  pending: Pending[];
  categories: Opt[];
  payments: Opt[];
}) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-6 py-8">
      <h1 className="text-xl font-semibold">정기 거래</h1>

      {pending.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-medium">대기 회차</h2>
          <ul className="flex flex-col gap-2">
            {pending.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {o.name}{" "}
                    <span className={o.type === "income" ? "text-emerald-600" : ""}>
                      {o.type === "income" ? "+" : "-"}
                      {won(o.amount)}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500">{formatKst(new Date(o.occurredAt))}</p>
                </div>
                <div className="flex shrink-0 gap-2 text-sm">
                  <form action={approveOccurrence}>
                    <input type="hidden" name="occId" value={o.id} />
                    <button className="text-emerald-600 underline">승인</button>
                  </form>
                  <form action={skipOccurrence}>
                    <input type="hidden" name="occId" value={o.id} />
                    <button className="text-zinc-500 underline">해제</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">등록된 정기 거래</h2>
        {defs.length === 0 ? (
          <p className="text-sm text-zinc-500">등록된 정기 거래가 없어요.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {defs.map((d) => (
              <DefRow key={d.id} def={d} categories={categories} payments={payments} />
            ))}
          </ul>
        )}
        {adding ? (
          <DefForm
            action={createRecurring}
            categories={categories}
            payments={payments}
            onDone={() => setAdding(false)}
          />
        ) : (
          <button className={ui.ghost} onClick={() => setAdding(true)}>
            정기 거래 추가
          </button>
        )}
      </section>
    </div>
  );
}

function DefRow({
  def,
  categories,
  payments,
}: {
  def: RecurringDef;
  categories: Opt[];
  payments: Opt[];
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (editing) {
    return (
      <li className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <DefForm
          action={updateRecurring}
          categories={categories}
          payments={payments}
          initial={def}
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate font-medium">{def.name}</span>
        <span className={`shrink-0 tabular-nums ${def.type === "income" ? "text-emerald-600" : ""}`}>
          {def.type === "income" ? "+" : "-"}
          {won(def.amount)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
        <span className="truncate">
          {describe(def)} · {def.mode === "auto" ? "자동 추가" : "알림 승인"}
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
      {confirming && (
        <form
          action={deleteRecurring}
          className="mt-1 flex items-center gap-2 rounded-lg bg-red-50 p-2 text-sm dark:bg-red-950/30"
        >
          <input type="hidden" name="id" value={def.id} />
          <span>삭제하면 대기 회차도 사라져요(생성된 거래는 보존).</span>
          <button className={ui.danger}>삭제</button>
          <button type="button" className={ui.ghost} onClick={() => setConfirming(false)}>
            취소
          </button>
        </form>
      )}
    </li>
  );
}

function DefForm({
  action,
  categories,
  payments,
  initial,
  onDone,
}: {
  action: FormAction;
  categories: Opt[];
  payments: Opt[];
  initial?: RecurringDef;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [type, setType] = useState<TxType>(initial?.type ?? "expense");
  const [freq, setFreq] = useState<Freq>(initial?.freq ?? "monthly");
  const [mode, setMode] = useState<RecurMode>(initial?.mode ?? "notify");
  const [month, setMonth] = useState(String(initial?.month ?? 1));
  const [day, setDay] = useState(String(initial?.day ?? 1));
  const [weekday, setWeekday] = useState(String(initial?.weekday ?? 1));

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  const fe = state && !state.ok ? state.fields : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="flex gap-2">
        <SegBtn active={type === "expense"} onClick={() => setType("expense")}>
          지출
        </SegBtn>
        <SegBtn active={type === "income"} onClick={() => setType("income")}>
          수입
        </SegBtn>
      </div>
      <input type="hidden" name="type" value={type} />

      <input
        className={ui.input}
        name="amount"
        inputMode="numeric"
        defaultValue={initial ? String(initial.amount) : ""}
        placeholder="금액"
        required
      />
      {fe?.amount && <p className={ui.alert}>{fe.amount}</p>}
      <input
        className={ui.input}
        name="name"
        defaultValue={initial?.name ?? ""}
        placeholder="등록명"
        maxLength={100}
        required
      />
      {fe?.name && <p className={ui.alert}>{fe.name}</p>}

      <select className={ui.input} name="categoryId" defaultValue={initial?.categoryId ?? ""}>
        <option value="">미분류</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        className={ui.input}
        name="paymentMethodId"
        defaultValue={initial?.paymentMethodId ?? ""}
      >
        <option value="">결제수단 없음</option>
        {payments.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <select
        className={ui.input}
        name="freq"
        value={freq}
        onChange={(e) => setFreq(e.target.value as Freq)}
      >
        <option value="daily">매일</option>
        <option value="weekly">매주</option>
        <option value="monthly">매월</option>
        <option value="yearly">매년</option>
      </select>

      {freq === "yearly" ? (
        <label className={ui.label}>
          월
          <select className={ui.input} name="month" value={month} onChange={(e) => setMonth(e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}월
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="month" value={month} />
      )}

      {freq === "yearly" || freq === "monthly" ? (
        <label className={ui.label}>
          일
          <input
            className={ui.input}
            type="number"
            min={1}
            max={31}
            name="day"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </label>
      ) : (
        <input type="hidden" name="day" value={day} />
      )}

      {freq === "weekly" ? (
        <label className={ui.label}>
          요일
          <select
            className={ui.input}
            name="weekday"
            value={weekday}
            onChange={(e) => setWeekday(e.target.value)}
          >
            {WEEKDAYS.map((w, i) => (
              <option key={i} value={i}>
                {w}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="weekday" value={weekday} />
      )}

      <label className={ui.label}>
        시각
        <input
          className={ui.input}
          type="time"
          name="time"
          defaultValue={initial ? `${pad(initial.hour)}:${pad(initial.minute)}` : "09:00"}
          required
        />
      </label>

      <select
        className={ui.input}
        name="mode"
        value={mode}
        onChange={(e) => setMode(e.target.value as RecurMode)}
      >
        <option value="notify">알림 승인</option>
        <option value="auto">자동 추가</option>
      </select>

      {mode === "notify" ? (
        <label className={ui.label}>
          미응답 시
          <select className={ui.input} name="expiry" defaultValue={initial?.expiry ?? "skip"}>
            <option value="skip">건너뛰기</option>
            <option value="add">자동 추가</option>
            <option value="hold">계속 보류</option>
          </select>
        </label>
      ) : (
        <input type="hidden" name="expiry" value="skip" />
      )}

      {initial && (
        <label className="flex items-center gap-2 text-sm text-zinc-500">
          <input type="checkbox" name="reflect" value="1" /> 대기 회차에도 반영
        </label>
      )}

      {state && !state.ok && !state.fields && <p className={ui.alert}>{state.error}</p>}

      <div className="flex gap-2">
        <button className={ui.button} disabled={pending}>
          {initial ? "저장" : "추가"}
        </button>
        <button type="button" className={ui.ghost} onClick={onDone}>
          취소
        </button>
      </div>
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
