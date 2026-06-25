import { test, expect } from "../fixtures/app";
import { seedPayment, setDefaultPayment } from "../helpers/seed";
import { listTransactions } from "../helpers/db";
import { selectOption, expectToast } from "../helpers/ui";

test.describe("거래 생성", () => {
  test("지출을 카테고리와 함께 저장하면 거래 문서가 정확히 쓰인다", async ({ page, appUser }) => {
    await page.goto("/");

    await page.getByLabel("금액").fill("15000");
    await page.getByLabel("지출명").fill("점심");
    await selectOption(page, "카테고리", "식비");
    await page.getByLabel("메모 (선택)").fill("회사 근처");
    await page.getByRole("button", { name: "저장" }).click();

    await expectToast(page, "저장했어요");

    await expect.poll(async () => (await listTransactions(appUser.uid)).length).toBe(1);
    const [tx] = await listTransactions(appUser.uid);
    expect(tx.name).toBe("점심");
    expect(tx.amount).toBe(15000);
    expect(tx.type).toBe("expense");
    expect(tx.memo).toBe("회사 근처");
    expect(tx.source).toBe("manual");
    expect(tx.categoryId).not.toBeNull();
    expect(tx.paymentMethodId).toBeNull();
    expect(Math.abs(tx.occurredAt.getTime() - Date.now())).toBeLessThan(5 * 60_000);
  });

  test("미분류·없음이면 categoryId/paymentMethodId가 null로 저장된다", async ({ page, appUser }) => {
    await page.goto("/");

    await page.getByLabel("금액").fill("3000");
    await page.getByLabel("지출명").fill("미분류 지출");
    await page.getByRole("button", { name: "저장" }).click();

    await expectToast(page, "저장했어요");

    await expect.poll(async () => (await listTransactions(appUser.uid)).length).toBe(1);
    const [tx] = await listTransactions(appUser.uid);
    expect(tx.categoryId).toBeNull();
    expect(tx.paymentMethodId).toBeNull();
  });

  test("수입 토글로 저장하면 type=income으로 쓰인다", async ({ page, appUser }) => {
    await page.goto("/");

    await page.getByRole("radio", { name: "수입" }).click();
    await page.getByLabel("금액").fill("2000000");
    await page.getByLabel("지출명").fill("월급");
    await page.getByRole("button", { name: "저장" }).click();

    await expectToast(page, "저장했어요");

    await expect.poll(async () => (await listTransactions(appUser.uid)).length).toBe(1);
    const [tx] = await listTransactions(appUser.uid);
    expect(tx.type).toBe("income");
    expect(tx.amount).toBe(2000000);
  });

  test("기본 결제수단이 미리 선택되어 그대로 저장된다", async ({ page, appUser }) => {
    const payId = await seedPayment(appUser.uid, "신한카드", { order: 0 });
    await setDefaultPayment(appUser.uid, payId);

    await page.goto("/");
    await page.getByLabel("금액").fill("8000");
    await page.getByLabel("지출명").fill("택시");
    await page.getByRole("button", { name: "저장" }).click();

    await expectToast(page, "저장했어요");

    await expect.poll(async () => (await listTransactions(appUser.uid)).length).toBe(1);
    const [tx] = await listTransactions(appUser.uid);
    expect(tx.paymentMethodId).toBe(payId);
  });
});
