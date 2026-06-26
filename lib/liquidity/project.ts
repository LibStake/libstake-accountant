import { enumerateOccurrences } from "@/lib/recurring/schedule";
import type { RecurringDef, TxType } from "@/lib/domain/types";

// 점검 구간. 한 수입 주기 뒤 회복까지 담을 만큼 — 무한 탐색을 막는 단일 상한.
const DAY_MS = 24 * 60 * 60 * 1000;
export const HORIZON_DAYS = 62;

// 펼친 정기 거래 한 회차. amount는 양수, 부호는 type으로 가린다.
export type LiquidityFlow = {
  at: Date;
  amount: number;
  type: TxType;
  name: string;
  defId: string;
};

// "이 날까지 버티려면 required가 있어야 한다" — 필요액이 늘어나는 지점.
export type LiquidityCheckpoint = {
  at: Date;
  required: number;
  name: string;
};

export type LiquidityResult = {
  required: number; // 가장 깊은 골의 크기(>=0)
  criticalAt: Date | null; // 가장 위험한 날(required>0)
  recoveredAt: Date | null; // 회복 시점(구조적 적자면 null)
  structuralDeficit: boolean;
  checkpoints: LiquidityCheckpoint[];
  flows: LiquidityFlow[];
  horizonEnd: Date;
};

// 지금을 0으로 두고, 정기 거래를 점검 구간만큼 펼쳐 누적이 0 밑으로 안 가게 하는
// 최소 보유액과 그 고비·회복 시점을 낸다. 잔액을 받지 않는 읽기 전용 계산.
export function projectLiquidity(defs: RecurringDef[], now: Date): LiquidityResult {
  const horizonEnd = new Date(now.getTime() + HORIZON_DAYS * DAY_MS);

  const flows: LiquidityFlow[] = [];
  for (const d of defs) {
    for (const at of enumerateOccurrences(d, now, horizonEnd)) {
      flows.push({ at, amount: d.amount, type: d.type, name: d.name, defId: d.id });
    }
  }
  flows.sort((a, b) => a.at.getTime() - b.at.getTime());

  let cum = 0; // 누적 현금흐름(수입 +, 지출 -)
  let minCum = 0; // 지금까지 최저 누적(0 이하)
  let criticalAt: Date | null = null;
  let lastBelowZeroIdx = -1;
  const checkpoints: LiquidityCheckpoint[] = [];

  flows.forEach((f, i) => {
    cum += f.type === "income" ? f.amount : -f.amount;
    if (cum < minCum) {
      minCum = cum;
      criticalAt = f.at;
      checkpoints.push({ at: f.at, required: -cum, name: f.name });
    }
    if (cum < 0) lastBelowZeroIdx = i;
  });

  const required = minCum < 0 ? -minCum : 0;
  const structuralDeficit = required > 0 && lastBelowZeroIdx === flows.length - 1;
  const recoveredAt =
    required === 0
      ? now
      : structuralDeficit
        ? null
        : flows[lastBelowZeroIdx + 1].at;

  return {
    required,
    criticalAt: required > 0 ? criticalAt : null,
    recoveredAt,
    structuralDeficit,
    checkpoints,
    flows,
    horizonEnd,
  };
}
