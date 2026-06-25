"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/guard";
import * as repo from "@/lib/domain/repo";
import { categoryInput, paymentInput } from "@/lib/validation/domain";
import { fail, ok, type Result } from "@/lib/server/result";

type State = Result<null> | null;
const PATH = "/settings";

async function uid(): Promise<string | null> {
  return (await getSession())?.uid ?? null;
}

function firstIssue(message: string | undefined): string {
  return message ?? "입력을 확인해주세요.";
}

/* ── 카테고리 ── */

export async function addCategory(_prev: State, formData: FormData): Promise<Result<null>> {
  const u = await uid();
  if (!u) return fail("로그인이 필요해요.");
  const parsed = categoryInput.safeParse({ name: formData.get("name") });
  if (!parsed.success) return fail(firstIssue(parsed.error.issues[0]?.message));
  await repo.addCategory(u, parsed.data.name);
  revalidatePath(PATH);
  return ok(null);
}

export async function renameCategory(_prev: State, formData: FormData): Promise<Result<null>> {
  const u = await uid();
  if (!u) return fail("로그인이 필요해요.");
  const id = String(formData.get("id") ?? "");
  const parsed = categoryInput.safeParse({ name: formData.get("name") });
  if (!id) return fail("잘못된 요청이에요.");
  if (!parsed.success) return fail(firstIssue(parsed.error.issues[0]?.message));
  await repo.renameCategory(u, id, parsed.data.name);
  revalidatePath(PATH);
  return ok(null);
}

export async function deleteCategory(formData: FormData): Promise<void> {
  const u = await uid();
  if (!u) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await repo.deleteCategory(u, id);
  revalidatePath(PATH);
}

export async function moveCategory(formData: FormData): Promise<void> {
  const u = await uid();
  if (!u) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await repo.moveCategory(u, id, formData.get("dir") === "up" ? -1 : 1);
  revalidatePath(PATH);
}

/* ── 결제수단 ── */

export async function addPayment(_prev: State, formData: FormData): Promise<Result<null>> {
  const u = await uid();
  if (!u) return fail("로그인이 필요해요.");
  const parsed = paymentInput.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
  });
  if (!parsed.success) return fail(firstIssue(parsed.error.issues[0]?.message));
  await repo.addPayment(u, parsed.data.name, parsed.data.kind);
  revalidatePath(PATH);
  return ok(null);
}

export async function renamePayment(_prev: State, formData: FormData): Promise<Result<null>> {
  const u = await uid();
  if (!u) return fail("로그인이 필요해요.");
  const id = String(formData.get("id") ?? "");
  const parsed = paymentInput.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
  });
  if (!id) return fail("잘못된 요청이에요.");
  if (!parsed.success) return fail(firstIssue(parsed.error.issues[0]?.message));
  await repo.renamePayment(u, id, parsed.data.name);
  revalidatePath(PATH);
  return ok(null);
}

export async function deletePayment(formData: FormData): Promise<void> {
  const u = await uid();
  if (!u) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await repo.deletePayment(u, id);
  revalidatePath(PATH);
}

export async function movePayment(formData: FormData): Promise<void> {
  const u = await uid();
  if (!u) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await repo.movePayment(u, id, formData.get("dir") === "up" ? -1 : 1);
  revalidatePath(PATH);
}

export async function archivePayment(formData: FormData): Promise<void> {
  const u = await uid();
  if (!u) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await repo.setPaymentArchived(u, id, formData.get("archived") === "1");
  revalidatePath(PATH);
}

export async function setDefaultPayment(formData: FormData): Promise<void> {
  const u = await uid();
  if (!u) return;
  const id = String(formData.get("paymentId") ?? "");
  await repo.setDefaultPayment(u, id || null);
  revalidatePath(PATH);
}
