import { test, expect } from "../fixtures/app";
import { seedUser, type SeededUser } from "../helpers/seed";
import { deleteUser } from "../helpers/cleanup";

test.describe("로그인", () => {
  let user: SeededUser | undefined;
  test.afterEach(async () => {
    if (user) await deleteUser(user.uid, user.email);
    user = undefined;
  });

  test("올바른 자격증명으로 로그인하면 홈으로 이동한다", async ({ page }) => {
    user = await seedUser({ password: "test-pass-1234" });
    await page.goto("/login");
    await page.getByLabel("이메일").fill(user.email);
    await page.getByLabel("비밀번호").fill("test-pass-1234");
    await page.getByRole("button", { name: "로그인" }).click();

    await expect(page).toHaveURL("/");
  });

  test("틀린 비밀번호는 오류를 표시하고 로그인 화면에 머문다", async ({ page }) => {
    user = await seedUser({ password: "test-pass-1234" });
    await page.goto("/login");
    await page.getByLabel("이메일").fill(user.email);
    await page.getByLabel("비밀번호").fill("wrong-password-9999");
    await page.getByRole("button", { name: "로그인" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });
});
