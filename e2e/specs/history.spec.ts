import { test, expect } from "../fixtures/app";
import { seedTransaction } from "../helpers/seed";

test.describe("내역 · 기간 단위", () => {
  test("기본은 일 단위이고 오늘 거래가 시간 오름차로 보이며 총 금액은 순액이다", async ({
    page,
    appUser,
  }) => {
    await seedTransaction(appUser.uid, {
      name: "오전지출",
      amount: 20000,
      type: "expense",
      occurredAt: new Date(Date.now() - 2 * 3600_000),
    });
    await seedTransaction(appUser.uid, {
      name: "오후수입",
      amount: 50000,
      type: "income",
      occurredAt: new Date(Date.now() - 1 * 3600_000),
    });

    await page.goto("/history");

    await expect(page.getByText("일", { exact: true })).toHaveAttribute(
      "data-state",
      "on",
    );

    const items = page.getByRole("listitem");
    await expect(items.first()).toContainText("오전지출");
    await expect(items.last()).toContainText("오후수입");

    await expect(page.getByText("총 금액")).toBeVisible();
    await expect(page.getByText("+30,000원")).toBeVisible();
  });

  test("단위를 넓히면 같은 거래가 월·연 범위에도 보인다", async ({
    page,
    appUser,
  }) => {
    await seedTransaction(appUser.uid, {
      name: "오늘거래",
      amount: 12000,
      type: "expense",
      occurredAt: new Date(),
    });

    await page.goto("/history");
    await expect(page.getByText("오늘거래")).toBeVisible();
    // 총 금액은 푸터에서 확인(같은 표기가 거래 행에도 있어 스코프한다).
    const footer = page.getByText("총 금액").locator("..");
    await expect(footer.getByText("-12,000원")).toBeVisible();

    await page.getByText("월", { exact: true }).click();
    await expect(page).toHaveURL(/u=month/);
    await expect(page.getByText("오늘거래")).toBeVisible();

    await page.getByText("연", { exact: true }).click();
    await expect(page).toHaveURL(/u=year/);
    await expect(page.getByText("오늘거래")).toBeVisible();
  });
});
