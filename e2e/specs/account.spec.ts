import { test, expect } from "../fixtures/app";
import { getPasswordHash, userExists } from "../helpers/db";
import { confirmInDialog } from "../helpers/ui";

test.describe("계정", () => {
  test("비밀번호를 변경하면 해시가 갱신된다", async ({ page, appUser }) => {
    const before = await getPasswordHash(appUser.uid);

    await page.goto("/account");
    await page.getByLabel("현재 비밀번호").fill(appUser.password);
    await page.getByLabel("새 비밀번호 (8자 이상)").fill("new-pass-5678");
    await page.getByRole("button", { name: "비밀번호 변경" }).click();

    await expect(page.getByText(/변경했어요/)).toBeVisible();
    await expect.poll(async () => await getPasswordHash(appUser.uid)).not.toBe(before);
  });

  test("로그아웃하면 로그인 화면으로 이동한다", async ({ page, appUser }) => {
    await page.goto("/account");
    await expect(page.getByText(appUser.email)).toBeVisible();
    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(page).toHaveURL("/login");
  });

  test("계정을 삭제하면 사용자 데이터가 제거된다", async ({ page, appUser }) => {
    await page.goto("/account");
    await page.getByRole("button", { name: "계정 삭제" }).click();
    await confirmInDialog(page, "영구 삭제");

    await expect(page).toHaveURL("/login");
    await expect.poll(async () => await userExists(appUser.uid)).toBe(false);
  });
});
