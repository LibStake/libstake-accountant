import { test, expect } from "../fixtures/app";
import { seedPayment, setDefaultPayment, seedTransaction } from "../helpers/seed";
import { listPayments, getDefaultPaymentId, findTransaction } from "../helpers/db";
import { selectOption, confirmInDialog } from "../helpers/ui";

test.describe("설정 · 결제수단", () => {
  test("결제수단을 계좌로 추가하면 kind=account로 저장된다", async ({ page, appUser }) => {
    await page.goto("/settings");
    const payForm = page.locator("form").filter({ has: page.getByPlaceholder("새 결제수단") });
    await payForm.getByPlaceholder("새 결제수단").fill("우리은행");
    await selectOption(payForm, "결제수단 종류", "계좌");
    await payForm.getByRole("button", { name: "추가" }).click();

    await expect(page.getByText("추가했어요")).toBeVisible();
    await expect
      .poll(async () => (await listPayments(appUser.uid)).find((p) => p.name === "우리은행")?.kind)
      .toBe("account");
  });

  test("결제수단을 페이로 추가하면 kind=pay로 저장된다", async ({ page, appUser }) => {
    await page.goto("/settings");
    const payForm = page.locator("form").filter({ has: page.getByPlaceholder("새 결제수단") });
    await payForm.getByPlaceholder("새 결제수단").fill("네이버페이");
    await selectOption(payForm, "결제수단 종류", "페이");
    await payForm.getByRole("button", { name: "추가" }).click();

    await expect(page.getByText("추가했어요")).toBeVisible();
    await expect
      .poll(async () => (await listPayments(appUser.uid)).find((p) => p.name === "네이버페이")?.kind)
      .toBe("pay");
  });

  test("기본으로 지정하면 사용자 문서에 반영된다", async ({ page, appUser }) => {
    const payId = await seedPayment(appUser.uid, "신한카드", { order: 0 });

    await page.goto("/settings");
    await page
      .locator("li")
      .filter({ hasText: "신한카드" })
      .getByRole("button", { name: "기본으로" })
      .click();

    await expect.poll(async () => await getDefaultPaymentId(appUser.uid)).toBe(payId);
  });

  test("기본 결제수단을 보관하면 기본 지정이 해제된다", async ({ page, appUser }) => {
    const payId = await seedPayment(appUser.uid, "카카오뱅크", { order: 0 });
    await setDefaultPayment(appUser.uid, payId);

    await page.goto("/settings");
    await page
      .locator("li")
      .filter({ hasText: "카카오뱅크" })
      .getByRole("button", { name: "보관" })
      .click();

    await expect
      .poll(async () => (await listPayments(appUser.uid)).find((p) => p.id === payId)?.archived)
      .toBe(true);
    // 보관은 archived 기록 뒤 기본 지정을 푸는 두 쓰기라 기본 해제는 폴링으로 기다린다.
    await expect.poll(async () => await getDefaultPaymentId(appUser.uid)).toBeNull();
  });

  test("결제수단을 삭제하면 사용 거래의 결제수단이 비워진다", async ({ page, appUser }) => {
    const payId = await seedPayment(appUser.uid, "현대카드", { order: 0 });
    const txId = await seedTransaction(appUser.uid, {
      name: "주유",
      amount: 60000,
      type: "expense",
      occurredAt: new Date(),
      paymentMethodId: payId,
    });

    await page.goto("/settings");
    await page
      .locator("li")
      .filter({ hasText: "현대카드" })
      .getByRole("button", { name: "삭제" })
      .click();
    await confirmInDialog(page, "삭제");

    await expect
      .poll(async () => (await listPayments(appUser.uid)).some((p) => p.id === payId))
      .toBe(false);
    const tx = await findTransaction(appUser.uid, (t) => t.id === txId);
    expect(tx?.paymentMethodId).toBeNull();
  });
});
