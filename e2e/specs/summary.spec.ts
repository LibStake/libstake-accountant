import { test, expect } from "../fixtures/app";
import { seedTransaction } from "../helpers/seed";
import { listCategories } from "../helpers/db";

test.describe("요약", () => {
  test("월 합계가 집계되고 지출·수입 토글로 막대가 전환된다", async ({ page, appUser }) => {
    const cats = await listCategories(appUser.uid);
    const food = cats.find((c) => c.name === "식비")!;
    const salary = cats.find((c) => c.name === "급여")!;
    const now = new Date();
    await seedTransaction(appUser.uid, { name: "점심", amount: 12000, type: "expense", occurredAt: now, categoryId: food.id });
    await seedTransaction(appUser.uid, { name: "저녁", amount: 8000, type: "expense", occurredAt: now, categoryId: food.id });
    await seedTransaction(appUser.uid, { name: "월급", amount: 3000000, type: "income", occurredAt: now, categoryId: salary.id });

    await page.goto("/summary");

    // net = 3,000,000 - 20,000
    await expect(page.getByText("2,980,000원")).toBeVisible();

    await expect(page.getByText("식비")).toBeVisible();
    await expect(page.getByText("급여")).toBeHidden();

    await page.getByRole("radio", { name: "수입" }).click();
    await expect(page.getByText("급여")).toBeVisible();
    await expect(page.getByText("식비")).toBeHidden();
  });
});
