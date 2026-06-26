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

  test("탭별 net 합계와 분해 팝오버, '모두'엔 합계 없음", async ({ page, appUser }) => {
    // auto 모드로 시드해 대기 회차 노이즈 없이 정의 리스트·합계만 검증한다.
    await seedRecurringDef(appUser.uid, { name: "커피", amount: 10000, type: "expense", freq: "weekly", weekday: 1, mode: "auto" });
    await seedRecurringDef(appUser.uid, { name: "넷플릭스", amount: 17000, type: "expense", freq: "monthly", day: 10, mode: "auto" });
    await seedRecurringDef(appUser.uid, { name: "용돈", amount: 50000, type: "income", freq: "monthly", day: 25, mode: "auto" });
    await seedRecurringDef(appUser.uid, { name: "교통", amount: 3000, type: "expense", freq: "daily", mode: "auto" });
    await seedRecurringDef(appUser.uid, { name: "보험", amount: 600000, type: "expense", freq: "yearly", month: 6, day: 1, mode: "auto" });

    await page.goto("/recurring");

    // 모두(기본): 전체 노출, 합계 푸터 없음.
    await expect(page.getByText("커피")).toBeVisible();
    await expect(page.getByText("보험")).toBeVisible();
    await expect(page.getByText("주간 합계")).toHaveCount(0);
    await expect(page.getByText("월간 합계")).toHaveCount(0);

    // 주간: 매주 항목만, net -10,000.
    await page.getByText("주간", { exact: true }).click();
    await expect(page.getByText("커피")).toBeVisible();
    await expect(page.getByText("넷플릭스")).toHaveCount(0);
    await expect(page.getByText("주간 합계")).toBeVisible();

    // 월간: 매월 항목만, 월간 합계 +33,000 / 예상 월간 합계 -101,583.
    await page.getByText("월간", { exact: true }).click();
    await expect(page.getByText("넷플릭스")).toBeVisible();
    await expect(page.getByText("커피")).toHaveCount(0);
    await expect(page.getByText("월간 합계", { exact: true })).toBeVisible();
    await expect(page.getByText("예상 월간 합계")).toBeVisible();
    await expect(page.getByText("-101,583원")).toBeVisible();

    // 월간 합계 클릭 → 수입/지출/합계 분해 팝오버.
    await page.getByText("월간 합계", { exact: true }).click();
    const pop = page.locator('[data-slot="popover-content"]');
    await expect(pop.getByText("수입")).toBeVisible();
    await expect(pop.getByText("+50,000원")).toBeVisible();
    await expect(pop.getByText("-17,000원")).toBeVisible();
    await expect(pop.getByText("+33,000원")).toBeVisible();
    await page.keyboard.press("Escape");

    // 연간: 예상 연간 합계 -1,819,000.
    await page.getByText("연간", { exact: true }).click();
    await expect(page.getByText("보험")).toBeVisible();
    await expect(page.getByText("예상 연간 합계")).toBeVisible();
    await expect(page.getByText("-1,819,000원")).toBeVisible();
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
