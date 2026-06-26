"use client";

import {
  useActionState,
  useEffect,
  useOptimistic,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatKst } from "@/lib/kst";
import type { Freq, RecurMode, RecurringDef, TxType } from "@/lib/domain/types";
import type { Result } from "@/lib/server/result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
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
import {
  approveOccurrence,
  createRecurring,
  deleteRecurring,
  skipOccurrence,
  updateRecurring,
} from "./actions";

type Opt = { id: string; name: string };
type DefWithNext = RecurringDef & { nextAt: string };
type Pending = { id: string; name: string; amount: number; type: TxType; occurredAt: string };
type FormAction = (prev: Result<null> | null, fd: FormData) => Promise<Result<null>>;
type Picks = { value: string; label: string }[];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n: number) => String(n).padStart(2, "0");
const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

// 주기별 연간 도래 횟수. 예상 지출은 연간 합을 구해 뷰별로 환산한다.
const ANNUAL_COUNT: Record<Freq, number> = {
  daily: 365,
  weekly: 52,
  monthly: 12,
  yearly: 1,
};
const VIEW_LABEL = { week: "주간", month: "월간", year: "연간" } as const;
type RecurView = keyof typeof VIEW_LABEL;

function describe(d: RecurringDef): string {
  const t = `${pad(d.hour)}:${pad(d.minute)}`;
  if (d.freq === "daily") return `매일 ${t}`;
  if (d.freq === "weekly") return `매주 ${WEEKDAYS[d.weekday]} ${t}`;
  if (d.freq === "monthly") return `매월 ${d.day}일 ${t}`;
  return `매년 ${d.month}월 ${d.day}일 ${t}`;
}

function Picker({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Picks;
  ariaLabel?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full" aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function RecurringView({
  defs,
  pending,
  categories,
  payments,
}: {
  defs: DefWithNext[];
  pending: Pending[];
  categories: Opt[];
  payments: Opt[];
}) {
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<RecurView>("month");

  const [optimisticPending, removePending] = useOptimistic(
    pending,
    (state, id: string) => state.filter((o) => o.id !== id),
  );
  const [optimisticDefs, removeDef] = useOptimistic(
    defs,
    (state, id: string) => state.filter((d) => d.id !== id),
  );

  async function onApprove(formData: FormData) {
    removePending(String(formData.get("occId") ?? ""));
    await approveOccurrence(formData);
    toast.success("승인했어요");
  }
  async function onSkip(formData: FormData) {
    removePending(String(formData.get("occId") ?? ""));
    await skipOccurrence(formData);
  }
  async function onDeleteDef(formData: FormData) {
    removeDef(String(formData.get("id") ?? ""));
    await deleteRecurring(formData);
  }

  // 도래가 임박한 순(오름차). 최신 도래가 리스트 최하단에 온다.
  const sortedDefs = [...optimisticDefs].sort((a, b) =>
    a.nextAt.localeCompare(b.nextAt),
  );

  const annualExpense = optimisticDefs
    .filter((d) => d.type === "expense")
    .reduce((sum, d) => sum + d.amount * ANNUAL_COUNT[d.freq], 0);
  const projected =
    view === "year"
      ? annualExpense
      : view === "month"
        ? Math.round(annualExpense / 12)
        : Math.round(annualExpense / 52);

  const scrollRef = useRef<HTMLDivElement>(null);
  // 뷰·탭 진입과 추가 폼 열림 시 최하단으로 내린다.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [view, adding]);

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col">
      <div className="flex flex-col gap-3 px-6 pt-6 pb-3">
        <h1 className="text-xl font-semibold">정기 거래</h1>
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && setView(v as RecurView)}
          variant="outline"
          spacing={0}
          className="w-full"
        >
          {(Object.keys(VIEW_LABEL) as RecurView[]).map((v) => (
            <ToggleGroupItem
              key={v}
              value={v}
              className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {VIEW_LABEL[v]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 pb-3"
      >
        {optimisticPending.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="font-medium">대기 회차</h2>
            <ul className="flex flex-col gap-2">
              {optimisticPending.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {o.name}{" "}
                      <span className={o.type === "expense" ? "text-destructive" : ""}>
                        {o.type === "income" ? "+" : "-"}
                        {won(o.amount)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatKst(new Date(o.occurredAt))}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <form action={onApprove}>
                      <input type="hidden" name="occId" value={o.id} />
                      <Button type="submit" variant="ghost" size="xs" className="text-emerald-600">
                        승인
                      </Button>
                    </form>
                    <form action={onSkip}>
                      <input type="hidden" name="occId" value={o.id} />
                      <Button type="submit" variant="ghost" size="xs" className="text-muted-foreground">
                        해제
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="font-medium">등록된 정기 거래</h2>
          {sortedDefs.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 정기 거래가 없어요.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {sortedDefs.map((d) => (
                <DefRow
                  key={d.id}
                  def={d}
                  categories={categories}
                  payments={payments}
                  onDelete={onDeleteDef}
                />
              ))}
            </ul>
          )}
          {adding && (
            <DefForm
              action={createRecurring}
              categories={categories}
              payments={payments}
              onDone={() => setAdding(false)}
            />
          )}
        </section>
      </div>

      <div className="flex flex-col gap-3 border-t px-6 py-4">
        {!adding && (
          <Button variant="outline" className="w-full" onClick={() => setAdding(true)}>
            정기 거래 추가
          </Button>
        )}
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">
            예상 {VIEW_LABEL[view]} 지출
          </span>
          <span className="text-lg font-semibold tabular-nums">{won(projected)}</span>
        </div>
      </div>
    </div>
  );
}

function DefRow({
  def,
  categories,
  payments,
  onDelete,
}: {
  def: RecurringDef;
  categories: Opt[];
  payments: Opt[];
  onDelete: (formData: FormData) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li>
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
    <li className="flex flex-col gap-1 rounded-lg border p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate font-medium">{def.name}</span>
        <span className={cn("shrink-0 tabular-nums", def.type === "expense" && "text-destructive")}>
          {def.type === "income" ? "+" : "-"}
          {won(def.amount)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">
          {describe(def)} · {def.mode === "auto" ? "자동 추가" : "알림 승인"}
        </span>
        <span className="flex shrink-0 gap-1">
          <Button type="button" variant="ghost" size="xs" onClick={() => setEditing(true)}>
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
                <AlertDialogTitle>삭제할까요?</AlertDialogTitle>
                <AlertDialogDescription>
                  삭제하면 대기 회차도 사라져요(생성된 거래는 보존).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <form action={onDelete}>
                  <input type="hidden" name="id" value={def.id} />
                  <AlertDialogAction type="submit" variant="destructive" className="w-full">
                    삭제
                  </AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </span>
      </div>
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
  const [expiry, setExpiry] = useState<string>(initial?.expiry ?? "skip");

  useEffect(() => {
    if (state?.ok) {
      onDone();
      toast.success(initial ? "저장했어요" : "추가했어요");
    }
  }, [state, onDone, initial]);

  const fe = state && !state.ok ? state.fields : undefined;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border p-3 duration-200 animate-in fade-in-0 slide-in-from-top-1"
    >
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="freq" value={freq} />
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="weekday" value={weekday} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="expiry" value={mode === "notify" ? expiry : "skip"} />

      <ToggleGroup
        type="single"
        value={type}
        onValueChange={(v) => v && setType(v as TxType)}
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

      <AmountInput
        name="amount"
        defaultValue={initial ? String(initial.amount) : ""}
        placeholder="금액"
        required
      />
      {fe?.amount && <p className="text-sm text-destructive">{fe.amount}</p>}
      <Input name="name" defaultValue={initial?.name ?? ""} placeholder="등록명" maxLength={100} required />
      {fe?.name && <p className="text-sm text-destructive">{fe.name}</p>}

      <FormSelect
        name="categoryId"
        ariaLabel="카테고리"
        defaultValue={initial?.categoryId ?? ""}
        emptyLabel="미분류"
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />
      <FormSelect
        name="paymentMethodId"
        ariaLabel="결제수단"
        defaultValue={initial?.paymentMethodId ?? ""}
        emptyLabel="결제수단 없음"
        options={payments.map((p) => ({ value: p.id, label: p.name }))}
      />

      <Picker
        value={freq}
        onChange={(v) => setFreq(v as Freq)}
        ariaLabel="주기"
        options={[
          { value: "daily", label: "매일" },
          { value: "weekly", label: "매주" },
          { value: "monthly", label: "매월" },
          { value: "yearly", label: "매년" },
        ]}
      />

      {freq === "yearly" && (
        <div className="flex flex-col gap-1.5">
          <Label>월</Label>
          <Picker
            value={month}
            onChange={setMonth}
            ariaLabel="월"
            options={Array.from({ length: 12 }, (_, i) => ({
              value: String(i + 1),
              label: `${i + 1}월`,
            }))}
          />
        </div>
      )}
      {(freq === "yearly" || freq === "monthly") && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="day-input">일</Label>
          <Input
            id="day-input"
            type="number"
            min={1}
            max={31}
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </div>
      )}
      {freq === "weekly" && (
        <div className="flex flex-col gap-1.5">
          <Label>요일</Label>
          <Picker
            value={weekday}
            onChange={setWeekday}
            ariaLabel="요일"
            options={WEEKDAYS.map((w, i) => ({ value: String(i), label: w }))}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="time-input">시각</Label>
        <Input
          id="time-input"
          type="time"
          name="time"
          defaultValue={initial ? `${pad(initial.hour)}:${pad(initial.minute)}` : "09:00"}
          required
        />
      </div>

      <Picker
        value={mode}
        onChange={(v) => setMode(v as RecurMode)}
        ariaLabel="모드"
        options={[
          { value: "notify", label: "알림 승인" },
          { value: "auto", label: "자동 추가" },
        ]}
      />

      {mode === "notify" && (
        <div className="flex flex-col gap-1.5">
          <Label>미응답 시</Label>
          <Picker
            value={expiry}
            onChange={setExpiry}
            ariaLabel="미응답 시"
            options={[
              { value: "skip", label: "건너뛰기" },
              { value: "add", label: "자동 추가" },
              { value: "hold", label: "계속 보류" },
            ]}
          />
        </div>
      )}

      {initial && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="reflect" value="1" className="size-4 accent-primary" /> 대기
          회차에도 반영
        </label>
      )}

      {state && !state.ok && !state.fields && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={pending}>
          {initial ? "저장" : "추가"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          취소
        </Button>
      </div>
    </form>
  );
}
