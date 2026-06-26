import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LiquidityResult } from "@/lib/liquidity/project";
import { HelpPopover } from "./HelpPopover";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

function kstDate(d: Date): string {
  const k = new Date(d.getTime() + KST_OFFSET_MS);
  return `${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일 (${WEEKDAY[k.getUTCDay()]})`;
}

function kstDayKey(d: Date): string {
  const k = new Date(d.getTime() + KST_OFFSET_MS);
  return `${k.getUTCFullYear()}-${k.getUTCMonth()}-${k.getUTCDate()}`;
}

function kstYmd(d: Date): string {
  const k = new Date(d.getTime() + KST_OFFSET_MS);
  return `${k.getUTCFullYear()}년 ${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일`;
}

const container = "mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-8";

export function LiquidityView({
  result,
  hasDefs,
  hasIncome,
  now,
}: {
  result: LiquidityResult;
  hasDefs: boolean;
  hasIncome: boolean;
  now: Date;
}) {
  const { required, criticalAt, recoveredAt, structuralDeficit, flows } = result;

  if (!hasDefs) {
    return (
      <div className={container}>
        <h1 className="font-semibold">유동성</h1>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            등록된 정기 거래가 없어요.
            <br />
            정기 거래를 등록하면 유동성을 계산해 드려요.
          </p>
          <Button asChild>
            <Link href="/recurring">정기 거래 등록</Link>
          </Button>
        </div>
      </div>
    );
  }

  // required로 시작했다고 보고 흐름마다 잔여를 굴린다 — 가장 위험한 날 잔여가 0이 된다.
  const timeline = flows.map((f, i) => ({
    ...f,
    run: flows
      .slice(0, i + 1)
      .reduce((acc, g) => acc + (g.type === "income" ? g.amount : -g.amount), required),
  }));

  // 같은 날짜의 흐름을 한 덩어리로 묶는다. before=그날 시작 시 필요 금액, run=마무리 후.
  const groups = timeline.reduce<
    { key: string; date: Date; items: typeof timeline; before: number; run: number }[]
  >((acc, f) => {
    const key = kstDayKey(f.at);
    const last = acc[acc.length - 1];
    if (last && last.key === key) {
      return [...acc.slice(0, -1), { ...last, items: [...last.items, f], run: f.run }];
    }
    const before = last ? last.run : required;
    return [...acc, { key, date: f.at, items: [f], before, run: f.run }];
  }, []);

  const criticalKey = hasIncome && criticalAt ? kstDayKey(criticalAt) : null;
  // 필요 금액은 회복 시점까지만 의미가 있다(그 뒤는 그냥 남는 돈).
  const recoveredTime = recoveredAt?.getTime() ?? null;

  return (
    <div className={container}>
      <h1 className="font-semibold">유동성</h1>

      {!hasIncome ? (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">정기 수입을 등록해 주세요</p>
              <p className="text-xs text-muted-foreground">
                다음 수입까지 필요한 금액은 정기 수입(월급 등)을 알아야 계산할 수 있어요. 지금은
                지출만 등록돼 있어요.
              </p>
            </div>
            <Button asChild size="sm" className="self-start">
              <Link href="/recurring">정기 수입 등록</Link>
            </Button>
          </CardContent>
        </Card>
      ) : structuralDeficit ? (
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-sm font-medium text-destructive">
              정기 수입이 지출을 못 따라가요
            </p>
            <p className="text-xs text-muted-foreground">
              들어오는 정기 수입보다 나가는 정기 지출이 많아요.
              {criticalAt ? ` 가장 위험한 날은 ${kstDate(criticalAt)}.` : ""}
            </p>
          </CardContent>
        </Card>
      ) : required === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm">앞으로 두 달간 정기 지출로 인한 부족 위험이 없어요.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted-foreground">
                {kstYmd(now)} 현재 최소 필요 보유액
              </p>
              <HelpPopover>
                <p>
                  다음 수입이 들어올 때까지 등록된 정기 지출을 문제없이 처리하는 데 필요한 최소
                  현금이에요.
                </p>
                <p>
                  가계부에 그때그때 적는 일반 지출은 포함하지 않아요. 평소 쓸 돈은 따로 두고, 이
                  금액만큼은 현금으로 들고 있어야 해요.
                </p>
                <p>
                  현재 정기 지출 항목을 기준으로 계산해요. 지출 대기 중이거나 취소된 정기 거래
                  회차는 포함하지 않아요.
                </p>
              </HelpPopover>
            </div>
            <p className="text-3xl font-semibold tabular-nums">{won(required)}</p>
            <p className="text-sm text-muted-foreground">
              가장 위험한 날{" "}
              <span className="font-medium text-destructive">
                {criticalAt ? kstDate(criticalAt) : "-"}
              </span>
              {recoveredAt ? (
                <>
                  {" · "}
                  <span className="font-medium text-emerald-600">{kstDate(recoveredAt)}</span>{" "}
                  이후 회복
                </>
              ) : null}
            </p>
          </CardContent>
        </Card>
      )}

      {groups.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground">예정 흐름</h2>
          <ul className="flex flex-col gap-4">
            {groups.map((g) => {
              const danger = criticalKey === g.key;
              return (
                <li key={g.key} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`text-sm font-semibold ${danger ? "text-destructive" : "text-foreground"}`}
                    >
                      {kstDate(g.date)}
                      {danger && (
                        <span className="ml-1 text-xs font-normal text-destructive">
                          가장 위험
                        </span>
                      )}
                    </span>
                    {required > 0 &&
                      hasIncome &&
                      (recoveredTime === null || g.date.getTime() <= recoveredTime) && (
                        <span
                          className={`text-xs tabular-nums ${danger ? "font-medium text-destructive" : "text-muted-foreground"}`}
                        >
                          필요 금액 {won(g.before)}
                        </span>
                      )}
                  </div>
                  <ul className="flex flex-col gap-1 border-l-2 border-muted pl-3">
                    {g.items.map((f, i) => (
                      <li
                        key={`${f.defId}-${i}`}
                        className="flex items-baseline justify-between gap-2 text-sm"
                      >
                        <span className="min-w-0 truncate text-muted-foreground">
                          {f.name}
                        </span>
                        <span
                          className={`shrink-0 font-medium tabular-nums ${f.type === "income" ? "text-emerald-600" : "text-destructive"}`}
                        >
                          {f.type === "income" ? "+" : "−"}
                          {won(f.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
