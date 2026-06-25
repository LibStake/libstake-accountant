"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/guard";
import * as repo from "@/lib/domain/repo";
import { txInput } from "@/lib/validation/domain";
import { fieldErrors } from "@/lib/validation/form";
import { fromKstInputValue } from "@/lib/kst";
import { fail, ok, type Result } from "@/lib/server/result";

type State = Result<null> | null;

export async function updateTransaction(
  _prev: State,
  formData: FormData,
): Promise<Result<null>> {
  const session = await getSession();
  if (!session) return fail("로그인이 필요해요.");
  const id = String(formData.get("id") ?? "");
  if (!id) return fail("잘못된 요청이에요.");
  const parsed = txInput.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    categoryId: formData.get("categoryId"),
    paymentMethodId: formData.get("paymentMethodId"),
    occurredAt: formData.get("occurredAt"),
    memo: formData.get("memo"),
  });
  if (!parsed.success) return fail("입력을 확인해주세요.", fieldErrors(parsed.error));
  const d = parsed.data;
  await repo.updateTransaction(session.uid, id, {
    name: d.name,
    amount: d.amount,
    type: d.type,
    categoryId: d.categoryId,
    paymentMethodId: d.paymentMethodId,
    occurredAt: fromKstInputValue(d.occurredAt),
    memo: d.memo,
  });
  revalidatePath("/history");
  return ok(null);
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await repo.deleteTransaction(session.uid, id);
  revalidatePath("/history");
}
