"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/guard";
import * as recRepo from "@/lib/recurring/repo";
import { reconcile } from "@/lib/recurring/reconcile";
import { recurringInput } from "@/lib/validation/domain";
import { fieldErrors } from "@/lib/validation/form";
import { fail, ok, type Result } from "@/lib/server/result";
import type { DefInput } from "@/lib/recurring/repo";

type State = Result<null> | null;
const PATH = "/recurring";

async function uid(): Promise<string | null> {
  return (await getSession())?.uid ?? null;
}

function readDef(formData: FormData): { data: DefInput } | { error: Result<null> } {
  const [hh, mm] = String(formData.get("time") ?? "").split(":");
  const parsed = recurringInput.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId"),
    paymentMethodId: formData.get("paymentMethodId"),
    freq: formData.get("freq"),
    month: formData.get("month"),
    day: formData.get("day"),
    weekday: formData.get("weekday"),
    hour: hh,
    minute: mm,
    mode: formData.get("mode"),
    expiry: formData.get("expiry"),
  });
  if (!parsed.success)
    return { error: fail("입력을 확인해주세요.", fieldErrors(parsed.error)) };
  return { data: parsed.data };
}

export async function createRecurring(
  _prev: State,
  formData: FormData,
): Promise<Result<null>> {
  const u = await uid();
  if (!u) return fail("로그인이 필요해요.");
  const r = readDef(formData);
  if ("error" in r) return r.error;
  await recRepo.addDef(u, r.data);
  await reconcile(u, true);
  revalidatePath(PATH);
  return ok(null);
}

export async function updateRecurring(
  _prev: State,
  formData: FormData,
): Promise<Result<null>> {
  const u = await uid();
  if (!u) return fail("로그인이 필요해요.");
  const id = String(formData.get("id") ?? "");
  if (!id) return fail("잘못된 요청이에요.");
  const r = readDef(formData);
  if ("error" in r) return r.error;
  await recRepo.updateDef(u, id, r.data);
  if (formData.get("reflect") === "1") await recRepo.reflectToPending(u, id, r.data);
  await reconcile(u, true);
  revalidatePath(PATH);
  return ok(null);
}

export async function deleteRecurring(formData: FormData): Promise<void> {
  const u = await uid();
  if (!u) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await recRepo.deleteDef(u, id);
  revalidatePath(PATH);
}

export async function approveOccurrence(formData: FormData): Promise<void> {
  const u = await uid();
  if (!u) return;
  const id = String(formData.get("occId") ?? "");
  if (!id) return;
  await recRepo.approveOccurrence(u, id);
  revalidatePath(PATH);
  revalidatePath("/history");
}

export async function skipOccurrence(formData: FormData): Promise<void> {
  const u = await uid();
  if (!u) return;
  const id = String(formData.get("occId") ?? "");
  if (!id) return;
  await recRepo.skipOccurrence(u, id);
  revalidatePath(PATH);
}
