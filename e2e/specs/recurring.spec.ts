import { test, expect } from "../fixtures/app";
import { seedRecurringDef, seedOccurrence } from "../helpers/seed";
import { listDefs, getOccurrence, findTransaction } from "../helpers/db";
import { confirmInDialog } from "../helpers/ui";

const TWO_DAYS_AGO = () => new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

test.describe("정기 거래", () => {
  test("정기 거래를 추가하면 정의가 생성된다", async ({ page, appUser }) => {
    await page.goto("/recurring");
    await page.getByRole("button", { name: "정기 거래 추가" }).click();
    await page.getByPlaceholder("금액").fill("9900");
    await page.getByPlaceholder("등록명").fill("넷플릭스");
    await page.getByLabel("일").fill("10");
    await page.getByRole("button", { name: "추가", exact: true }).click();

    await expect(page.getByText("추가했어요")).toBeVisible();
    await expect.poll(async () => (await listDefs(appUser.uid)).length).toBe(1);
    const [def] = await listDefs(appUser.uid);
    expect(def.name).toBe("넷플릭스");
    expect(def.amount).toBe(9900);
    expect(def.freq).toBe("monthly");
    expect(def.day).toBe(10);
  });

  test("대기 회차를 승인하면 거래가 생성되고 상태가 approved가 된다", async ({ page, appUser }) => {
    const defId = await seedRecurringDef(appUser.uid, {
      name: "월세",
      amount: 500000,
      freq: "monthly",
      day: 15,
      mode: "notify",
      expiry: "hold",
    });
    const occId = await seedOccurrence(appUser.uid, {
      defId,
      occurredAt: TWO_DAYS_AGO(),
      name: "월세",
      amount: 500000,
      type: "expense",
    });

    await page.goto("/recurring");
    await page.getByRole("button", { name: "승인" }).click();
    await expect(page.getByText("승인했어요")).toBeVisible();

    await expect.poll(async () => (await getOccurrence(appUser.uid, occId))?.status).toBe("approved");
    const tx = await findTransaction(appUser.uid, (t) => t.source === "recurring");
    expect(tx?.amount).toBe(500000);
  });

  test("대기 회차를 해제하면 상태가 skipped가 된다", async ({ page, appUser }) => {
    const defId = await seedRecurringDef(appUser.uid, {
      name: "헬스",
      amount: 50000,
      freq: "monthly",
      day: 15,
      mode: "notify",
      expiry: "hold",
    });
    const occId = await seedOccurrence(appUser.uid, {
      defId,
      occurredAt: TWO_DAYS_AGO(),
      name: "헬스",
      amount: 50000,
      type: "expense",
    });

    await page.goto("/recurring");
    await page.getByRole("button", { name: "해제" }).click();

    await expect.poll(async () => (await getOccurrence(appUser.uid, occId))?.status).toBe("skipped");
  });

  test("정기 정의를 삭제하면 정의와 대기 회차가 사라진다", async ({ page, appUser }) => {
    const defId = await seedRecurringDef(appUser.uid, {
      name: "보험",
      amount: 30000,
      freq: "monthly",
      day: 15,
      mode: "notify",
      expiry: "hold",
    });
    const occId = await seedOccurrence(appUser.uid, {
      defId,
      occurredAt: TWO_DAYS_AGO(),
      name: "보험",
      amount: 30000,
      type: "expense",
    });

    await page.goto("/recurring");
    await page.getByRole("button", { name: "삭제" }).click();
    await confirmInDialog(page, "삭제");

    await expect.poll(async () => (await listDefs(appUser.uid)).length).toBe(0);
    await expect
      .poll(async () => (await getOccurrence(appUser.uid, occId))?.status ?? "gone")
      .toBe("gone");
  });
});
