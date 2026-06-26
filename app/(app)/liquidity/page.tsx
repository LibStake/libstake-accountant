import { requireSession } from "@/lib/auth/guard";
import { listDefs } from "@/lib/recurring/repo";
import { projectLiquidity } from "@/lib/liquidity/project";
import { LiquidityView } from "./LiquidityView";

export default async function LiquidityPage() {
  const { uid } = await requireSession();
  // 미래 흐름만 펼치므로 도래 재조정과 무관하다(읽기 전용).
  const defs = await listDefs(uid);
  const now = new Date();
  const result = projectLiquidity(defs, now);
  const hasIncome = defs.some((d) => d.type === "income");
  return (
    <LiquidityView
      result={result}
      hasDefs={defs.length > 0}
      hasIncome={hasIncome}
      now={now}
    />
  );
}
