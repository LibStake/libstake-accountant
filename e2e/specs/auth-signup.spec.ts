import { test, expect } from "../fixtures/app";
import { newTestEmail } from "../helpers/namespace";
import { uidByEmail, listCategories } from "../helpers/db";
import { deleteUserByEmail } from "../helpers/cleanup";

test.describe("회원가입", () => {
  let email = "";
  test.afterEach(async () => {
    if (email) await deleteUserByEmail(email);
    email = "";
  });

  test("가입하면 자동 로그인되고 기본 카테고리가 시드된다", async ({ page }) => {
    email = newTestEmail();
    await page.goto("/signup");
    await page.getByLabel("이메일").fill(email);
    await page.getByLabel("비밀번호 (8자 이상)").fill("test-pass-1234");
    await page.getByRole("button", { name: "가입하기" }).click();

    await expect(page).toHaveURL("/");

    const uid = await uidByEmail(email);
    expect(uid).not.toBeNull();
    await expect.poll(async () => (await listCategories(uid!)).length).toBe(7);
  });
});
