import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HORIZON_DAYS, type LiquidityResult } from "@/lib/liquidity/project";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

function kstDate(d: Date): string {
  const k = new Date(d.getTime() + KST_OFFSET_MS);
  return `${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일 (${WEEKDAY[k.getUTCDay()]})`;
}

const container = "mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-8";

export function LiquidityView({
  result,
  hasDefs,
}: {
  result: LiquidityResult;
  hasDefs: boolean;
}) {
  const { required, criticalAt, recoveredAt, structuralDeficit, checkpoints, flows } =
    result;

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

  return (
    <div className={container}>
      <h1 className="font-semibold">유동성</h1>

      {structuralDeficit && (
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-sm font-medium text-destructive">
              정기 수입이 지출을 못 메워요
            </p>
            <p className="text-xs text-muted-foreground">
              앞으로 {HORIZON_DAYS}일 안에서는 누적이 회복되지 않아요. 더 긴 흐름을 확인하세요.
            </p>
          </CardContent>
        </Card>
      )}

      {required === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm">
              앞으로 {HORIZON_DAYS}일간 정기 지출로 인한 부족 위험이 없어요.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">지금 필요한 최소 보유액</p>
            <p className="text-3xl font-semibold tabular-nums">{won(required)}</p>
            <p className="text-sm text-muted-foreground">
              가장 위험한 날 {criticalAt ? kstDate(criticalAt) : "-"}
              {recoveredAt ? ` · ${kstDate(recoveredAt)} 이후 회복` : ""}
            </p>
          </CardContent>
        </Card>
      )}

      {checkpoints.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">언제까지 얼마</h2>
          <ul className="flex flex-col gap-2">
            {checkpoints.map((c, i) => {
              const last = i === checkpoints.length - 1;
              return (
                <li
                  key={c.at.getTime()}
                  className="flex items-baseline justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {kstDate(c.at)}까지
                    <span className="ml-1 text-xs text-muted-foreground">{c.name}</span>
                  </span>
                  <span
                    className={`shrink-0 tabular-nums ${last ? "font-semibold" : ""}`}
                  >
                    {won(c.required)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {timeline.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">예정 흐름</h2>
          <ul className="flex flex-col gap-3">
            {timeline.map((f, i) => (
              <li
                key={`${f.defId}-${f.at.getTime()}-${i}`}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate">{f.name}</span>
                  <span className="text-xs text-muted-foreground">{kstDate(f.at)}</span>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span
                    className={`tabular-nums ${f.type === "income" ? "text-emerald-600" : "text-muted-foreground"}`}
                  >
                    {f.type === "income" ? "+" : "−"}
                    {won(f.amount)}
                  </span>
                  <span
                    className={`text-xs tabular-nums ${f.run === 0 ? "font-medium text-destructive" : "text-muted-foreground"}`}
                  >
                    잔여 {won(f.run)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
