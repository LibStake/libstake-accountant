import { test, expect } from "../fixtures/app";
import { seedTransaction } from "../helpers/seed";
import { listCategories, findTransaction } from "../helpers/db";
import { confirmInDialog } from "../helpers/ui";

test.describe("설정 · 카테고리", () => {
  test("카테고리를 추가하면 Firestore에 생긴다", async ({ page, appUser }) => {
    await page.goto("/settings");
    await page.getByPlaceholder("새 카테고리").fill("여행");
    await page.getByPlaceholder("새 카테고리").press("Enter");

    await expect(page.getByText("추가했어요")).toBeVisible();
    await expect
      .poll(async () => (await listCategories(appUser.uid)).map((c) => c.name))
      .toContain("여행");
  });

  test("카테고리 이름을 수정하면 갱신된다", async ({ page, appUser }) => {
    await page.goto("/settings");
    await page
      .locator("li")
      .filter({ hasText: "식비" })
      .getByRole("button", { name: "수정" })
      .click();

    const editForm = page.locator("form").filter({ has: page.getByRole("button", { name: "저장" }) });
    await editForm.getByRole("textbox").fill("식사");
    await editForm.getByRole("button", { name: "저장" }).click();

    await expect(page.getByText("수정했어요")).toBeVisible();
    await expect
      .poll(async () => (await listCategories(appUser.uid)).map((c) => c.name))
      .toContain("식사");
  });

  test("카테고리를 삭제하면 사용 거래의 분류가 비워진다", async ({ page, appUser }) => {
    const food = (await listCategories(appUser.uid)).find((c) => c.name === "식비")!;
    const txId = await seedTransaction(appUser.uid, {
      name: "점심",
      amount: 9000,
      type: "expense",
      occurredAt: new Date(),
      categoryId: food.id,
    });

    await page.goto("/settings");
    await page
      .locator("li")
      .filter({ hasText: "식비" })
      .getByRole("button", { name: "삭제" })
      .click();
    await confirmInDialog(page, "삭제");

    await expect
      .poll(async () => (await listCategories(appUser.uid)).some((c) => c.name === "식비"))
      .toBe(false);
    const tx = await findTransaction(appUser.uid, (t) => t.id === txId);
    expect(tx?.categoryId).toBeNull();
  });

  test("아래로 이동하면 순서가 바뀐다", async ({ page, appUser }) => {
    await page.goto("/settings");
    await page
      .locator("li")
      .filter({ hasText: "식비" })
      .getByRole("button", { name: "아래로" })
      .click();

    await expect.poll(async () => (await listCategories(appUser.uid))[0].name).toBe("교통");
  });
});
