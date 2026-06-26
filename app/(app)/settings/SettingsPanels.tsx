"use client";

import { useActionState, useEffect, useOptimistic, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import type { PaymentKind } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { FormSelect } from "@/components/form/FormSelect";
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
type MoveAction = { kind: "delete"; id: string } | { kind: "move"; id: string; dir: "up" | "down" };

const PAYMENT_KINDS = [
  { value: "card", label: "카드" },
  { value: "account", label: "계좌" },
  { value: "pay", label: "페이" },
] satisfies { value: PaymentKind; label: string }[];

const kindLabel = (kind: PaymentKind): string =>
  PAYMENT_KINDS.find((k) => k.value === kind)?.label ?? kind;

function reorder<T extends { id: string }>(state: T[], a: MoveAction): T[] {
  if (a.kind === "delete") return state.filter((x) => x.id !== a.id);
  const i = state.findIndex((x) => x.id === a.id);
  const j = a.dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= state.length) return state;
  const next = [...state];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

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
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-8">
      <h1 className="text-xl font-semibold">관리</h1>
      <CategorySection categories={categories} />
      <PaymentSection payments={payments} defaultPaymentId={defaultPaymentId} />
      <Button asChild variant="outline" className="h-auto w-full justify-start py-3">
        <Link href="/account">계정 · 보안</Link>
      </Button>
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
        <Button type="submit" variant="ghost" size="icon-xs" disabled={index === 0} aria-label="위로">
          <ChevronUp />
        </Button>
      </form>
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="dir" value="down" />
        <Button
          type="submit"
          variant="ghost"
          size="icon-xs"
          disabled={index === total - 1}
          aria-label="아래로"
        >
          <ChevronDown />
        </Button>
      </form>
    </>
  );
}

function DeleteButton({
  id,
  description,
  action,
}: {
  id: string;
  description: string;
  action: VoidAction;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" size="xs" className="text-destructive">
          삭제
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <form action={action}>
            <input type="hidden" name="id" value={id} />
            <AlertDialogAction type="submit" variant="destructive" className="w-full">
              삭제
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ── 카테고리 ── */

function CategorySection({ categories }: { categories: Cat[] }) {
  const [optimistic, dispatch] = useOptimistic(categories, reorder<Cat>);
  const [state, action, pending] = useActionState(addCategory, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      toast.success("추가했어요");
    }
  }, [state]);

  async function onMove(formData: FormData) {
    dispatch({ kind: "move", id: String(formData.get("id") ?? ""), dir: formData.get("dir") === "up" ? "up" : "down" });
    await moveCategory(formData);
  }
  async function onDelete(formData: FormData) {
    dispatch({ kind: "delete", id: String(formData.get("id") ?? "") });
    await deleteCategory(formData);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>카테고리</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {optimistic.length > 0 && (
          <ul className="flex flex-col divide-y">
            {optimistic.map((c, i) => (
              <CategoryRow
                key={c.id}
                cat={c}
                index={i}
                total={optimistic.length}
                onMove={onMove}
                onDelete={onDelete}
              />
            ))}
          </ul>
        )}
        <form ref={formRef} action={action} className="flex gap-2">
          <Input name="name" placeholder="새 카테고리" maxLength={40} required />
          <Button type="submit" variant="outline" disabled={pending}>
            추가
          </Button>
        </form>
        {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
      </CardContent>
    </Card>
  );
}

function CategoryRow({
  cat,
  index,
  total,
  onMove,
  onDelete,
}: {
  cat: Cat;
  index: number;
  total: number;
  onMove: VoidAction;
  onDelete: VoidAction;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: Parameters<typeof renameCategory>[0], formData: FormData) => {
      const r = await renameCategory(prev, formData);
      if (r.ok) {
        setEditing(false);
        toast.success("수정했어요");
      }
      return r;
    },
    null,
  );

  return (
    <li className="flex flex-col gap-2 py-2 first:pt-0 last:pb-0">
      {editing ? (
        <form action={action} className="flex gap-2">
          <input type="hidden" name="id" value={cat.id} />
          <Input name="name" defaultValue={cat.name} maxLength={40} required autoFocus />
          <Button type="submit" variant="outline" disabled={pending}>
            저장
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            취소
          </Button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate">{cat.name}</span>
          <div className="flex items-center gap-0.5 text-muted-foreground">
            <MoveButtons id={cat.id} index={index} total={total} action={onMove} />
            <Button type="button" variant="ghost" size="xs" onClick={() => setEditing(true)}>
              수정
            </Button>
            <DeleteButton
              id={cat.id}
              action={onDelete}
              description={
                cat.usage > 0
                  ? `이 카테고리를 쓰는 거래 ${cat.usage}건의 분류가 비워져요.`
                  : "이 카테고리를 삭제할까요?"
              }
            />
          </div>
        </div>
      )}
      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
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
  const [optimistic, dispatch] = useOptimistic(payments, reorder<Pay>);
  const [state, action, pending] = useActionState(addPayment, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      toast.success("추가했어요");
    }
  }, [state]);

  async function onMove(formData: FormData) {
    dispatch({ kind: "move", id: String(formData.get("id") ?? ""), dir: formData.get("dir") === "up" ? "up" : "down" });
    await movePayment(formData);
  }
  async function onDelete(formData: FormData) {
    dispatch({ kind: "delete", id: String(formData.get("id") ?? "") });
    await deletePayment(formData);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>결제수단</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {optimistic.length > 0 && (
          <ul className="flex flex-col divide-y">
            {optimistic.map((p, i) => (
              <PaymentRow
                key={p.id}
                pay={p}
                index={i}
                total={optimistic.length}
                isDefault={p.id === defaultPaymentId}
                onMove={onMove}
                onDelete={onDelete}
              />
            ))}
          </ul>
        )}
        <form ref={formRef} action={action} className="flex gap-2">
          <Input name="name" placeholder="새 결제수단" maxLength={40} required />
          <FormSelect
            name="kind"
            ariaLabel="결제수단 종류"
            defaultValue="card"
            className="w-24"
            options={PAYMENT_KINDS}
          />
          <Button type="submit" variant="outline" disabled={pending}>
            추가
          </Button>
        </form>
        {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
      </CardContent>
    </Card>
  );
}

function PaymentRow({
  pay,
  index,
  total,
  isDefault,
  onMove,
  onDelete,
}: {
  pay: Pay;
  index: number;
  total: number;
  isDefault: boolean;
  onMove: VoidAction;
  onDelete: VoidAction;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: Parameters<typeof renamePayment>[0], formData: FormData) => {
      const r = await renamePayment(prev, formData);
      if (r.ok) {
        setEditing(false);
        toast.success("수정했어요");
      }
      return r;
    },
    null,
  );

  return (
    <li className="flex flex-col gap-2 py-2 first:pt-0 last:pb-0">
      {editing ? (
        <form action={action} className="flex gap-2">
          <input type="hidden" name="id" value={pay.id} />
          <input type="hidden" name="kind" value={pay.kind} />
          <Input name="name" defaultValue={pay.name} maxLength={40} required autoFocus />
          <Button type="submit" variant="outline" disabled={pending}>
            저장
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            취소
          </Button>
        </form>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate">{pay.name}</span>
              <span className="text-xs text-muted-foreground">
                {kindLabel(pay.kind)}
              </span>
              {isDefault && <Badge>기본</Badge>}
              {pay.archived && <Badge variant="secondary">보관됨</Badge>}
            </div>
            <div className="flex items-center gap-0.5 text-muted-foreground">
              <MoveButtons id={pay.id} index={index} total={total} action={onMove} />
              <Button type="button" variant="ghost" size="xs" onClick={() => setEditing(true)}>
                수정
              </Button>
              <DeleteButton
                id={pay.id}
                action={onDelete}
                description={
                  pay.usage > 0
                    ? `이 결제수단을 쓰는 거래 ${pay.usage}건의 결제수단이 비워져요.`
                    : "이 결제수단을 삭제할까요?"
                }
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
            {!pay.archived && !isDefault && (
              <form action={setDefaultPayment}>
                <input type="hidden" name="paymentId" value={pay.id} />
                <Button type="submit" variant="ghost" size="xs">
                  기본으로
                </Button>
              </form>
            )}
            {isDefault && (
              <form action={setDefaultPayment}>
                <input type="hidden" name="paymentId" value="" />
                <Button type="submit" variant="ghost" size="xs">
                  기본 해제
                </Button>
              </form>
            )}
            <form action={archivePayment}>
              <input type="hidden" name="id" value={pay.id} />
              <input type="hidden" name="archived" value={pay.archived ? "0" : "1"} />
              <Button type="submit" variant="ghost" size="xs">
                {pay.archived ? "복원" : "보관"}
              </Button>
            </form>
          </div>
        </>
      )}
      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
    </li>
  );
}
