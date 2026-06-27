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
import { formatKst, toKstInputValue } from "@/lib/kst";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  approveOccurrenceEdited,
  createRecurring,
  deleteRecurring,
  skipOccurrence,
  updateRecurring,
} from "./actions";

type Opt = { id: string; name: string };
type DefWithNext = RecurringDef & { nextAt: string };
type Pending = {
  id: string;
  name: string;
  amount: number;
  type: TxType;
  categoryId: string | null;
  paymentMethodId: string | null;
  occurredAt: string;
};
type FormAction = (prev: Result<null> | null, fd: FormData) => Promise<Result<null>>;
type Picks = { value: string; label: string }[];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n: number) => String(n).padStart(2, "0");
const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

// 주기별 연간 도래 횟수. 예상 결제는 연간 합을 구해 기간으로 환산한다.
const ANNUAL_COUNT: Record<Freq, number> = {
  daily: 365,
  weekly: 52,
  monthly: 12,
  yearly: 1,
};

// 모두는 다음 도래일순, 나머지는 그 주기로 필터해 윈도 내 시간순으로 본다.
const TABS = [
  { value: "all", label: "모두" },
  { value: "week", label: "주간" },
  { value: "month", label: "월간" },
  { value: "year", label: "연간" },
] as const;
type RecurView = (typeof TABS)[number]["value"];

const VIEW_FREQ: Record<Exclude<RecurView, "all">, Freq> = {
  week: "weekly",
  month: "monthly",
  year: "yearly",
};

// 윈도 내 정렬 키: 주간=요일, 월간=일, 연간=월·일, 시각으로 동률 정리.
function windowKey(d: RecurringDef): number {
  const t = d.hour * 100 + d.minute;
  if (d.freq === "weekly") return d.weekday * 10000 + t;
  if (d.freq === "monthly") return d.day * 10000 + t;
  if (d.freq === "yearly") return d.month * 1000000 + d.day * 10000 + t;
  return t;
}

const signed = (n: number) => `${n > 0 ? "+" : ""}${n.toLocaleString("ko-KR")}원`;

// 정기 항목들을 환산계수로 곱해 수입·지출·순액으로 분해한다.
type Balance = { income: number; expense: number; net: number };
function balanceOf(
  defs: RecurringDef[],
  factorOf: (d: RecurringDef) => number,
): Balance {
  let income = 0;
  let expense = 0;
  for (const d of defs) {
    const v = Math.round(d.amount * factorOf(d));
    if (d.type === "income") income += v;
    else expense += v;
  }
  return { income, expense, net: income - expense };
}

function AmountLine({
  label,
  value,
  bold,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={cn("text-muted-foreground", bold && "font-medium text-foreground")}>
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums",
          bold && "font-semibold",
          value < 0 ? "text-destructive" : "text-foreground",
        )}
      >
        {signed(value)}
      </span>
    </div>
  );
}

// 라벨·순액을 누르면 팝오버로 수입·지출·합계 분해를 연다.
function BalanceItem({ label, data }: { label: string; data: Balance }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-baseline justify-between gap-2 text-left"
        >
          <span className="text-sm text-muted-foreground underline decoration-dotted underline-offset-4">
            {label}
          </span>
          <span
            className={cn(
              "text-lg font-semibold tabular-nums",
              data.net < 0 ? "text-destructive" : "text-foreground",
            )}
          >
            {signed(data.net)}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56">
        <div className="flex flex-col gap-2 text-sm">
          <AmountLine label="수입" value={data.income} />
          <AmountLine label="지출" value={-data.expense} />
          <div className="border-t pt-2">
            <AmountLine label="합계" value={data.net} bold />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function describe(d: RecurringDef): string {
  const t = `${pad(d.hour)}:${pad(d.minute)}`;
  if (d.freq === "daily") return `매일 ${t}`;
  if (d.freq === "weekly") return `매주 ${WEEKDAYS[d.weekday]} ${t}`;
  if (d.freq === "monthly") return `매월 ${d.day}일 ${t}`;
  return `매년 ${d.month}월 ${d.day}일 ${t}`;
}

// 일정(주기+결제일시) 동일성 비교용 서명 — 주기에 무관한 필드는 무시한다.
function scheduleSig(
  freq: Freq,
  month: string,
  day: string,
  weekday: string,
  time: string,
): string {
  if (freq === "daily") return `daily|${time}`;
  if (freq === "weekly") return `weekly|${weekday}|${time}`;
  if (freq === "monthly") return `monthly|${day}|${time}`;
  return `yearly|${month}|${day}|${time}`;
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
  const [view, setView] = useState<RecurView>("all");

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

  // 모두는 다음 도래일순, 나머지는 그 주기로 필터해 윈도 내 시간순으로 본다.
  const freq = view === "all" ? null : VIEW_FREQ[view];
  const listDefs =
    freq === null
      ? [...optimisticDefs].sort((a, b) => a.nextAt.localeCompare(b.nextAt))
      : optimisticDefs
          .filter((d) => d.freq === freq)
          .sort((a, b) => windowKey(a) - windowKey(b));

  const scrollRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  // 탭 전환 시 맨 위로, 추가 폼을 열면 폼 상단이 보이게 맞춘다.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [view]);
  useEffect(() => {
    if (adding) formRef.current?.scrollIntoView({ block: "start" });
  }, [adding]);

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
          {TABS.map((t) => (
            <ToggleGroupItem
              key={t.value}
              value={t.value}
              className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {t.label}
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
                <PendingRow
                  key={o.id}
                  occ={o}
                  categories={categories}
                  payments={payments}
                  onApprove={onApprove}
                  onSkip={onSkip}
                />
              ))}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="font-medium">등록된 정기 거래</h2>
          {listDefs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {view === "all"
                ? "등록된 정기 거래가 없어요."
                : "이 주기의 정기 거래가 없어요."}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {listDefs.map((d) => (
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
            <div ref={formRef}>
              <DefForm
                action={createRecurring}
                categories={categories}
                payments={payments}
                onDone={() => setAdding(false)}
              />
            </div>
          )}
        </section>
      </div>

      <div className="flex flex-col gap-3 border-t px-6 py-4">
        {!adding && (
          <Button variant="outline" className="w-full" onClick={() => setAdding(true)}>
            정기 거래 추가
          </Button>
        )}
        {view === "week" && (
          <BalanceItem
            label="주간 합계"
            data={balanceOf(
              optimisticDefs.filter((d) => d.freq === "weekly"),
              () => 1,
            )}
          />
        )}
        {view === "month" && (
          <>
            <BalanceItem
              label="월간 합계"
              data={balanceOf(
                optimisticDefs.filter((d) => d.freq === "monthly"),
                () => 1,
              )}
            />
            <BalanceItem
              label="예상 월간 합계"
              data={balanceOf(
                optimisticDefs.filter((d) => ANNUAL_COUNT[d.freq] >= 12),
                (d) => ANNUAL_COUNT[d.freq] / 12,
              )}
            />
          </>
        )}
        {view === "year" && (
          <>
            <BalanceItem
              label="연간 합계"
              data={balanceOf(
                optimisticDefs.filter((d) => d.freq === "yearly"),
                () => 1,
              )}
            />
            <BalanceItem
              label="예상 연간 합계"
              data={balanceOf(optimisticDefs, (d) => ANNUAL_COUNT[d.freq])}
            />
          </>
        )}
      </div>
    </div>
  );
}

function PendingRow({
  occ,
  categories,
  payments,
  onApprove,
  onSkip,
}: {
  occ: Pending;
  categories: Opt[];
  payments: Opt[];
  onApprove: (formData: FormData) => Promise<void>;
  onSkip: (formData: FormData) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li>
        <ApproveEditForm
          occ={occ}
          categories={categories}
          payments={payments}
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-1 rounded-lg border p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate font-medium">{occ.name}</span>
        <span className={cn("shrink-0 tabular-nums", occ.type === "expense" && "text-destructive")}>
          {occ.type === "income" ? "+" : "-"}
          {won(occ.amount)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">{formatKst(new Date(occ.occurredAt))}</span>
        <span className="flex shrink-0 items-center gap-1">
          <form action={onApprove}>
            <input type="hidden" name="occId" value={occ.id} />
            <Button type="submit" variant="ghost" size="xs" className="text-emerald-600">
              승인
            </Button>
          </form>
          <Button type="button" variant="ghost" size="xs" onClick={() => setEditing(true)}>
            수정 후 승인
          </Button>
          <form action={onSkip}>
            <input type="hidden" name="occId" value={occ.id} />
            <Button type="submit" variant="ghost" size="xs" className="text-muted-foreground">
              해제
            </Button>
          </form>
        </span>
      </div>
    </li>
  );
}

// 회차 값을 채운 거래 폼. 승인 시에만 그 값으로 거래가 만들어지고, 취소는 아무것도 저장하지 않는다.
function ApproveEditForm({
  occ,
  categories,
  payments,
  onDone,
}: {
  occ: Pending;
  categories: Opt[];
  payments: Opt[];
  onDone: () => void;
}) {
  // 성공 시 회차가 목록에서 빠지며 이 폼이 언마운트되므로, 토스트는 useEffect가 아니라 여기서 즉시 띄운다.
  const [state, formAction, pending] = useActionState(
    async (prev: Result<null> | null, formData: FormData) => {
      const r = await approveOccurrenceEdited(prev, formData);
      if (r.ok) {
        toast.success("승인했어요");
        onDone();
      }
      return r;
    },
    null,
  );
  const [type, setType] = useState<TxType>(occ.type);

  const fe = state && !state.ok ? state.fields : undefined;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border p-3 duration-200 animate-in fade-in-0 slide-in-from-top-1"
    >
      <input type="hidden" name="occId" value={occ.id} />
      <input type="hidden" name="type" value={type} />

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
        defaultValue={String(occ.amount)}
        placeholder="금액"
        required
      />
      {fe?.amount && <p className="text-sm text-destructive">{fe.amount}</p>}
      <Input name="name" defaultValue={occ.name} placeholder="항목명" maxLength={100} required />
      {fe?.name && <p className="text-sm text-destructive">{fe.name}</p>}

      <FormSelect
        name="categoryId"
        ariaLabel="카테고리"
        defaultValue={occ.categoryId ?? ""}
        emptyLabel="미분류"
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />
      <FormSelect
        name="paymentMethodId"
        ariaLabel="결제수단"
        defaultValue={occ.paymentMethodId ?? ""}
        emptyLabel="없음"
        options={payments.map((p) => ({ value: p.id, label: p.name }))}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`occAt-${occ.id}`}>발생일시</Label>
        <Input
          id={`occAt-${occ.id}`}
          type="datetime-local"
          name="occurredAt"
          defaultValue={toKstInputValue(new Date(occ.occurredAt))}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`memo-${occ.id}`}>메모 (선택)</Label>
        <Input id={`memo-${occ.id}`} name="memo" maxLength={500} />
      </div>

      {state && !state.ok && !state.fields && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={pending}>
          승인
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          취소
        </Button>
      </div>
    </form>
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
  const [time, setTime] = useState(
    initial ? `${pad(initial.hour)}:${pad(initial.minute)}` : "09:00",
  );

  // 편집 중 일정이 바뀌면 옛 회차·거래가 남는다는 경고를 띄운다.
  const scheduleChanged =
    !!initial &&
    scheduleSig(freq, month, day, weekday, time) !==
      scheduleSig(
        initial.freq,
        String(initial.month),
        String(initial.day),
        String(initial.weekday),
        `${pad(initial.hour)}:${pad(initial.minute)}`,
      );

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
          value={time}
          onChange={(e) => setTime(e.target.value)}
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

      {scheduleChanged && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
          {initial?.mode === "auto"
            ? "일정을 바꾸면 이미 추가된 거래는 그대로 남고, 새 일정으로 또 추가될 수 있어요. 내역에서 직접 정리하세요."
            : "일정을 바꾸면 옛 날짜의 대기 회차는 그대로 남아요. 대기 회차 목록에서 직접 해제하세요."}
        </p>
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
