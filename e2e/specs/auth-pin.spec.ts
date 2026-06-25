import { test, expect } from "../fixtures/app";
import { seedUser, seedDevice, type SeededUser } from "../helpers/seed";
import { mintDevice } from "../helpers/session";
import { listDevices } from "../helpers/db";
import { deleteUser } from "../helpers/cleanup";

test.describe("PIN 빠른 로그인", () => {
  test("PIN을 설정하면 기기 문서와 device 쿠키가 생긴다", async ({ page, context, appUser }) => {
    await page.goto("/account");
    await page.getByPlaceholder("숫자 6자리").fill("135790");
    await page.getByRole("button", { name: "설정" }).click();

    await expect(page.getByText("저장했어요")).toBeVisible();
    await expect.poll(async () => (await listDevices(appUser.uid)).length).toBe(1);
    const cookies = await context.cookies();
    expect(cookies.some((c) => c.name === "device")).toBe(true);
  });

  test.describe("기기 PIN으로 언락", () => {
    let user: SeededUser | undefined;
    test.afterEach(async () => {
      if (user) await deleteUser(user.uid, user.email);
      user = undefined;
    });

    async function primeDevice(
      context: import("@playwright/test").BrowserContext,
      baseURL: string | undefined,
      pin: string,
    ): Promise<SeededUser> {
      const u = await seedUser();
      const deviceId = await seedDevice(u.uid, pin);
      const token = await mintDevice(u.uid, deviceId);
      await context.addCookies([
        {
          name: "device",
          value: token,
          url: baseURL ?? "http://localhost:3000",
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
      return u;
    }

    test("올바른 PIN으로 언락하면 홈으로 이동한다", async ({ page, context, baseURL }) => {
      user = await primeDevice(context, baseURL, "246810");
      await page.goto("/login");
      await page.getByRole("textbox", { name: "PIN" }).pressSequentially("246810");

      await expect(page).toHaveURL("/");
    });

    test("틀린 PIN은 실패하고 failCount가 증가한다", async ({ page, context, baseURL }) => {
      user = await primeDevice(context, baseURL, "246810");
      await page.goto("/login");
      await page.getByRole("textbox", { name: "PIN" }).pressSequentially("000000");

      await expect(page.getByRole("alert")).toBeVisible();
      await expect(page).toHaveURL("/login");
      await expect.poll(async () => (await listDevices(user!.uid))[0]?.failCount).toBe(1);
    });
  });
});
