"use client";

import { Suspense, use, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toKstInputValue } from "@/lib/kst";
import type { TxType } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { AmountInput } from "@/components/form/AmountInput";
import { FormSelect } from "@/components/form/FormSelect";
import { createTransaction } from "./actions";

type Opt = { id: string; name: string };
type Recent = { id: string; name: string; amount: number; type: TxType };
type FormOptions = {
  categories: Opt[];
  payments: Opt[];
  defaultPaymentId: string | null;
};

export function EntryForm({
  form,
  recent,
}: {
  form: Promise<FormOptions>;
  recent: Promise<Recent[]>;
}) {
  const router = useRouter();
  const [type, setType] = useState<"expense" | "income">("expense");
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const [state, action, pending] = useActionState(
    async (prev: Parameters<typeof createTransaction>[0], formData: FormData) => {
      const r = await createTransaction(prev, formData);
      if (r.ok) {
        setName("");
        setMemo("");
        setType("expense");
        setOccurredAt(toKstInputValue(new Date()));
        setResetKey((k) => k + 1);
        // 최근 입력 목록을 새로 읽어 방금 저장분을 반영한다.
        router.refresh();
        toast.success("저장했어요");
      }
      return r;
    },
    null,
  );

  // 발생일시 기본값 = 현재(KST). 마운트 후 채워 하이드레이션 불일치를 피한다.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 하이드레이션 안전을 위해 마운트 후 1회만 설정
    setOccurredAt(toKstInputValue(new Date()));
  }, []);

  const fieldErr = state && !state.ok ? state.fields : undefined;

  return (
    <form action={action} className="mx-auto flex h-full w-full max-w-md flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pt-6 pb-3">
        <ToggleGroup
          type="single"
          value={type}
          onValueChange={(v) => v && setType(v as "expense" | "income")}
          variant="outline"
          spacing={0}
          className="w-full"
          aria-label="종류"
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
        <input type="hidden" name="type" value={type} />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount" className="text-muted-foreground">
            금액
          </Label>
          <AmountInput
            key={`amt-${resetKey}`}
            id="amount"
            name="amount"
            className="h-auto py-3 text-3xl font-semibold tabular-nums md:text-3xl"
            placeholder="0"
            autoFocus={resetKey > 0}
            required
          />
          {fieldErr?.amount && <p className="text-sm text-destructive">{fieldErr.amount}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">항목명</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
          />
          {fieldErr?.name && <p className="text-sm text-destructive">{fieldErr.name}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>카테고리</Label>
          <Suspense fallback={<Skeleton className="h-9 w-full" />}>
            <CategoryField data={form} resetKey={resetKey} />
          </Suspense>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>결제수단</Label>
          <Suspense fallback={<Skeleton className="h-9 w-full" />}>
            <PaymentField data={form} resetKey={resetKey} />
          </Suspense>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="occurredAt">발생일시</Label>
          <Input
            id="occurredAt"
            type="datetime-local"
            name="occurredAt"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="memo">메모 (선택)</Label>
          <Input
            id="memo"
            name="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            maxLength={500}
          />
        </div>

        <Suspense fallback={null}>
          <RecentList data={recent} />
        </Suspense>

        {state && !state.ok && !state.fields && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
      </div>

      <div className="border-t px-6 py-4">
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "저장 중…" : "저장"}
        </Button>
      </div>
    </form>
  );
}

function CategoryField({
  data,
  resetKey,
}: {
  data: Promise<FormOptions>;
  resetKey: number;
}) {
  const { categories } = use(data);
  return (
    <FormSelect
      key={`cat-${resetKey}`}
      name="categoryId"
      ariaLabel="카테고리"
      emptyLabel="미분류"
      options={categories.map((c) => ({ value: c.id, label: c.name }))}
    />
  );
}

function PaymentField({
  data,
  resetKey,
}: {
  data: Promise<FormOptions>;
  resetKey: number;
}) {
  const { payments, defaultPaymentId } = use(data);
  return (
    <FormSelect
      key={`pay-${resetKey}`}
      name="paymentMethodId"
      ariaLabel="결제수단"
      defaultValue={defaultPaymentId ?? ""}
      emptyLabel="없음"
      options={payments.map((p) => ({ value: p.id, label: p.name }))}
    />
  );
}

function RecentList({ data }: { data: Promise<Recent[]> }) {
  const recent = use(data);
  if (recent.length === 0) return null;
  return (
    <div className="mt-2 flex flex-col gap-2 border-t pt-3">
      <p className="text-xs text-muted-foreground">최근 입력</p>
      <ul className="flex flex-col gap-1">
        {recent.map((t) => (
          <li
            key={t.id}
            className="flex items-baseline justify-between gap-2 text-sm"
          >
            <span className="min-w-0 truncate text-muted-foreground">{t.name}</span>
            <span
              className={cn(
                "shrink-0 tabular-nums",
                t.type === "expense" ? "text-destructive" : "text-foreground",
              )}
            >
              {t.type === "income" ? "+" : "-"}
              {t.amount.toLocaleString("ko-KR")}원
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
