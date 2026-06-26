import { test, expect } from "../fixtures/app";
import { listCategories } from "../helpers/db";

test.describe("관리 진입 동선", () => {
  test("관리는 탭으로, 계정·보안은 관리에서 진입하며 요약에서는 빠졌다", async ({ page, appUser }) => {
    await page.goto("/summary");
    await expect(page.getByRole("link", { name: "계정 · 보안" })).toHaveCount(0);

    await page.getByRole("link", { name: "관리" }).click();
    await expect(page).toHaveURL(/\/settings$/);
    // 시드된 기본 카테고리가 보이면 이 유저의 관리 화면이 열린 것이다.
    const cats = await listCategories(appUser.uid);
    await expect(page.getByText(cats[0].name).first()).toBeVisible();

    await page.getByRole("link", { name: "계정 · 보안" }).click();
    await expect(page).toHaveURL(/\/account$/);
  });
});
