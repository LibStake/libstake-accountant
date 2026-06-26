import { test, expect } from "../fixtures/app";
import { seedRecurringDef } from "../helpers/seed";
import { listDefs } from "../helpers/db";

// 투영은 현재시각 의존이므로 daily 정의로 today 무관하게 상태를 고정한다.
test.describe("유동성", () => {
  test("정기 거래가 없으면 등록을 안내한다", async ({ page, appUser }) => {
    expect((await listDefs(appUser.uid)).length).toBe(0);
    await page.goto("/liquidity");
    await expect(page.getByText("등록된 정기 거래가 없어요.")).toBeVisible();
    await expect(page.getByRole("link", { name: "정기 거래 등록" })).toBeVisible();
  });

  test("정기 수입이 없으면 수입 등록을 안내한다", async ({ page, appUser }) => {
    await seedRecurringDef(appUser.uid, {
      name: "교통",
      amount: 10000,
      type: "expense",
      freq: "daily",
      mode: "auto",
    });

    await page.goto("/liquidity");
    await expect(page.getByText("정기 수입을 등록해 주세요")).toBeVisible();
    await expect(page.getByRole("link", { name: "정기 수입 등록" })).toBeVisible();
  });

  test("정기 수입이 지출을 못 따라가면 적자를 알린다", async ({ page, appUser }) => {
    await seedRecurringDef(appUser.uid, {
      name: "교통",
      amount: 30000,
      type: "expense",
      freq: "daily",
      mode: "auto",
    });
    await seedRecurringDef(appUser.uid, {
      name: "용돈",
      amount: 10000,
      type: "income",
      freq: "daily",
      mode: "auto",
    });

    await page.goto("/liquidity");
    await expect(page.getByText("정기 수입이 지출을 못 따라가요")).toBeVisible();
  });

  test("정기 수입만 있으면 부족 위험이 없다", async ({ page, appUser }) => {
    await seedRecurringDef(appUser.uid, {
      name: "용돈",
      amount: 30000,
      type: "income",
      freq: "daily",
      mode: "auto",
    });

    await page.goto("/liquidity");
    await expect(page.getByText("정기 지출로 인한 부족 위험이 없어요.")).toBeVisible();
  });
});
