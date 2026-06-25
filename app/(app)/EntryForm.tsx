"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { toKstInputValue } from "@/lib/kst";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { FormSelect } from "@/components/form/FormSelect";
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
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const amountRef = useRef<HTMLInputElement>(null);

  // 저장 성공 시 폼을 비우고 다음 입력에 대비한다. 셀렉트는 resetKey 리마운트로 초기화.
  const [state, action, pending] = useActionState(
    async (prev: Parameters<typeof createTransaction>[0], formData: FormData) => {
      const r = await createTransaction(prev, formData);
      if (r.ok) {
        setAmount("");
        setName("");
        setMemo("");
        setType("expense");
        setOccurredAt(toKstInputValue(new Date()));
        setResetKey((k) => k + 1);
        amountRef.current?.focus();
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
    <form action={action} className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-8">
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
        <Input
          ref={amountRef}
          id="amount"
          className="h-auto py-3 text-3xl font-semibold tabular-nums md:text-3xl"
          name="amount"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
          required
        />
        {fieldErr?.amount && <p className="text-sm text-destructive">{fieldErr.amount}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">지출명</Label>
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
        <FormSelect
          key={`cat-${resetKey}`}
          name="categoryId"
          emptyLabel="미분류"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>결제수단</Label>
        <FormSelect
          key={`pay-${resetKey}`}
          name="paymentMethodId"
          defaultValue={defaultPaymentId ?? ""}
          emptyLabel="없음"
          options={payments.map((p) => ({ value: p.id, label: p.name }))}
        />
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

      {state && !state.ok && !state.fields && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "저장 중…" : "저장"}
      </Button>
    </form>
  );
}
