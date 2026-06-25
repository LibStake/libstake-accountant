import { test, expect } from "../fixtures/app";
import { seedTransaction } from "../helpers/seed";
import { listCategories, listTransactions, findTransaction } from "../helpers/db";
import { selectOption, confirmInDialog, expectToast } from "../helpers/ui";

test.describe("거래 수정·삭제", () => {
  test("거래를 수정하면 Firestore 문서가 갱신된다", async ({ page, appUser }) => {
    const food = (await listCategories(appUser.uid)).find((c) => c.name === "식비")!;
    const txId = await seedTransaction(appUser.uid, {
      name: "수정전",
      amount: 1000,
      type: "expense",
      occurredAt: new Date(),
    });

    await page.goto("/history");
    await page.getByRole("button", { name: "수정" }).click();
    await page.locator('input[name="amount"]').fill("9999");
    await page.locator('input[name="name"]').fill("수정후");
    await selectOption(page, "카테고리", "식비");
    await page.getByRole("button", { name: "저장" }).click();

    await expectToast(page, "수정했어요");

    await expect
      .poll(async () => (await findTransaction(appUser.uid, (t) => t.id === txId))?.amount)
      .toBe(9999);
    const tx = await findTransaction(appUser.uid, (t) => t.id === txId);
    expect(tx?.name).toBe("수정후");
    expect(tx?.categoryId).toBe(food.id);
  });

  test("거래를 삭제하면 행이 사라지고 문서가 제거된다", async ({ page, appUser }) => {
    await seedTransaction(appUser.uid, {
      name: "삭제대상",
      amount: 5000,
      type: "expense",
      occurredAt: new Date(),
    });

    await page.goto("/history");
    await expect(page.getByText("삭제대상")).toBeVisible();

    await page.getByRole("button", { name: "삭제" }).click();
    await confirmInDialog(page, "삭제");

    await expect
      .poll(async () => (await listTransactions(appUser.uid)).length)
      .toBe(0);
  });
});
