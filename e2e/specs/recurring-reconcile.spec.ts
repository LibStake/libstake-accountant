import { test, expect } from "../fixtures/app";
import { seedRecurringDef, seedOccurrence } from "../helpers/seed";
import {
  listOccurrences,
  getOccurrence,
  listTransactions,
  findTransaction,
} from "../helpers/db";

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);

// (app) 진입마다 layout이 reconcile(uid)를 돌린다. 정의의 lastReconciledAt을 과거로 두면
// 그 사이 도래분이 이 진입에서 채워진다. 40일 백데이트는 월간 1회 이상 도래를 보장한다.
test.describe("정기 reconcile 엔진", () => {
  test("알림 모드: 진입 reconcile이 도래분을 대기 회차로 만들고 배지에 노출한다", async ({
    page,
    appUser,
  }) => {
    const defId = await seedRecurringDef(
      appUser.uid,
      { name: "넷플릭스", amount: 13500, freq: "monthly", day: 15, mode: "notify", expiry: "hold" },
      { lastReconciledAt: daysAgo(40) },
    );

    await page.goto("/recurring");

    await expect
      .poll(async () =>
        (await listOccurrences(appUser.uid)).filter(
          (o) => o.defId === defId && o.status === "pending",
        ).length,
      )
      .toBeGreaterThanOrEqual(1);

    const pending = (await listOccurrences(appUser.uid)).filter(
      (o) => o.defId === defId && o.status === "pending",
    );
    // 회차는 정의의 스냅샷(이름·금액)을 복제한다.
    expect(pending.every((o) => o.name === "넷플릭스" && o.amount === 13500)).toBe(true);

    // 배지와 대기 목록 모두 첫 진입에 반영된다.
    const recurringTab = page.getByRole("link", { name: "정기" });
    await expect(recurringTab.getByText(String(pending.length), { exact: true })).toBeVisible();

    const pendingSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "대기 회차" }) });
    await expect(pendingSection.getByText("넷플릭스")).toBeVisible();
  });

  test("자동 모드: 진입 reconcile이 도래분 거래를 자동 실체화한다", async ({ page, appUser }) => {
    const defId = await seedRecurringDef(
      appUser.uid,
      { name: "정기적금", amount: 200000, freq: "monthly", day: 15, mode: "auto" },
      { lastReconciledAt: daysAgo(40) },
    );

    await page.goto("/recurring");

    await expect
      .poll(async () =>
        (await listOccurrences(appUser.uid)).filter(
          (o) => o.defId === defId && o.status === "auto",
        ).length,
      )
      .toBeGreaterThanOrEqual(1);

    const autoOccs = (await listOccurrences(appUser.uid)).filter(
      (o) => o.defId === defId && o.status === "auto",
    );
    const recurringTxs = (await listTransactions(appUser.uid)).filter(
      (t) => t.source === "recurring",
    );
    // 회차 1건당 거래 1건이 같은 트랜잭션에서 만들어진다.
    expect(recurringTxs.length).toBe(autoOccs.length);
    expect(recurringTxs.every((t) => t.amount === 200000 && t.name === "정기적금")).toBe(true);

    // 자동 모드는 승인이 필요 없어 대기 회차로 뜨지 않는다.
    await expect(page.getByRole("heading", { name: "대기 회차" })).toHaveCount(0);
  });

  test("알림 만료(건너뛰기): 윈도(D+5)를 넘긴 미응답 회차를 skipped 처리한다", async ({
    page,
    appUser,
  }) => {
    const defId = await seedRecurringDef(appUser.uid, {
      name: "잡지구독",
      amount: 9900,
      freq: "monthly",
      day: 15,
      mode: "notify",
      expiry: "skip",
    });
    const occId = await seedOccurrence(appUser.uid, {
      defId,
      occurredAt: daysAgo(7),
      name: "잡지구독",
      amount: 9900,
    });

    await page.goto("/recurring");

    await expect
      .poll(async () => (await getOccurrence(appUser.uid, occId))?.status)
      .toBe("skipped");
    expect(await findTransaction(appUser.uid, (t) => t.source === "recurring")).toBeUndefined();
  });

  test("알림 만료(자동 추가): 윈도를 넘긴 미응답 회차를 거래로 실체화한다", async ({
    page,
    appUser,
  }) => {
    const defId = await seedRecurringDef(appUser.uid, {
      name: "클라우드",
      amount: 77000,
      freq: "monthly",
      day: 15,
      mode: "notify",
      expiry: "add",
    });
    const occId = await seedOccurrence(appUser.uid, {
      defId,
      occurredAt: daysAgo(7),
      name: "클라우드",
      amount: 77000,
    });

    await page.goto("/recurring");

    await expect
      .poll(async () => (await getOccurrence(appUser.uid, occId))?.status)
      .toBe("approved");
    const tx = await findTransaction(
      appUser.uid,
      (t) => t.source === "recurring" && t.amount === 77000,
    );
    expect(tx?.name).toBe("클라우드");
  });
});
